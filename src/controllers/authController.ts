import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { signAccessToken, signRefreshToken, signVerifyEmailToken, verifyAccessToken, verifyEmailToken, verifyRefreshToken } from '../utils/jwt'
import { z } from 'zod'
import ms, { StringValue } from 'ms'
import { generateVerificationCode } from '../utils/utils'
import { sendVerificationEmail } from '../lib/mailer'

const prisma = new PrismaClient()

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const registerSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
})

const verifySchema = z.object({
    pin: z.string().length(6),
})

const me = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.accessToken
        if (!token) {
            res.status(401).json({ error: 'Not authenticated' })
            return
        }

        const payload = verifyAccessToken(token) as { id: string }
        const user = await prisma.user.findUnique({
            where: { id: Number(payload.id) },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                description: true,
                createdAt: true
            }
        })

        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        res.json({ user })
    } catch (err) {
        console.error(err)
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}


const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body)

        const user = await prisma.user.findUnique({ where: { email }})
        
        if (!user) {
            res.status(401).send('Invalid email or password')
            return
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            res.status(401).send('Invalid email or password')
            return
        }

        // 👉 Si no está verificado
        if (!user.isVerified) {
            const code = generateVerificationCode()
            const expiresMs = ms(process.env.JWT_VERIFY_EMAIL_EXPIRES as StringValue || '10m')
            const expires = new Date(Date.now() + expiresMs)

            await prisma.emailVerificationCode.create({
                data: {
                    userId: user.id,
                    code,
                    expiresAt: expires,
                },
            })

            await sendVerificationEmail(user.email, code)

            const token = signVerifyEmailToken({ userId: user.id })

            res.cookie('verify_email_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: expiresMs,
                sameSite: 'lax',
            })

            res.status(401).json({
                message: 'Please verify your email to continue.',
                isVerified: false,
            })
            return
        }

        // Si pasa validación, crea un objeto sin password para enviar
        const { password: _, ...userWithoutPassword } = user

        const accessToken = signAccessToken({ id: user.id })
        const refreshToken = signRefreshToken({ id: user.id })

        // Seteamos cookies con las opciones recomendadas
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_ACCESS_EXPIRES as StringValue || '1d'),
        })

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES as StringValue || '7d'),
        })

        res.status(200).json({
            user: { ...userWithoutPassword, isVerified: true },
            message: 'Authenticated successfully',
            isVerified: true,
        })
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

const register = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password } = registerSchema.parse(req.body)

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            res.status(400).json({ error: 'Email is already registered' })
            return
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashed,
            },
        })

        const code = generateVerificationCode()
        const expiresMs = ms(process.env.JWT_VERIFY_EMAIL_EXPIRES as StringValue || '10m')
        const expires = new Date(Date.now() + expiresMs)

        await prisma.emailVerificationCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt: expires,
            },
        })

        await sendVerificationEmail(user.email, code)

        const token = signVerifyEmailToken({ userId: user.id })

        res.cookie('verify_email_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_VERIFY_EMAIL_EXPIRES as StringValue || '10m'),
            sameSite: 'lax',
        })

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' })
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal server error')
    }
}

const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { pin } = verifySchema.parse(req.body)

        const token = req.cookies.verify_email_token
        if (!token) {
            res.status(401).json({ error: 'Token de verificación no encontrado' })
            return
        }

        const payload = verifyEmailToken(token)
        if (typeof payload !== 'object' || !payload.userId) {
            res.status(401).json({ error: 'Token inválido' })
            return
        }

        const userId = payload.userId
        const verificationCode = await prisma.emailVerificationCode.findFirst({
            where: {
                userId,
                    code: pin,
                    expiresAt: {
                    gt: new Date(),
                },
            },
        })

        if (!verificationCode) {
            res.status(400).json({ error: 'Código inválido o expirado' })
            return
        }

        // Actualiza el usuario como verificado
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        })

        // Borra el código usado
        await prisma.emailVerificationCode.delete({
            where: { id: verificationCode.id },
        })

        // Elimina cookie temporal
        res.clearCookie('verify_email_token')

        // Genera cookies normales como en login
        const accessToken = signAccessToken({ id: userId })
        const refreshToken = signRefreshToken({ id: userId })

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_ACCESS_EXPIRES as StringValue || '1d'),
        })

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES as StringValue || '7d'),
        })

        res.status(200).json({ message: 'Email verificado exitosamente' })
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Error interno del servidor')
    }
}

const resendVerification = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.verify_email_token

        if (!token) {
            res.status(401).json({ error: 'Missing verification token' })
            return
        }

        const payload = verifyEmailToken(token)

        if (typeof payload !== 'object' || !payload.userId) {
            res.status(401).json({ error: 'Token inválido' })
            return
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } })

        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'User is already verified' })
            return
        }

        // 👉 Revisa si ya se ha generado un código recientemente (en el último minuto)
        const oneMinuteAgo = new Date(Date.now() - ms('1m'))
        const recentCode = await prisma.emailVerificationCode.findFirst({
            where: {
                userId: user.id,
                createdAt: { gte: oneMinuteAgo },
            },
            orderBy: { createdAt: 'desc' },
        })

        if (recentCode) {
            res.status(429).json({ error: 'You can request a new code every 1 minute. Please wait a bit.' })
            return
        }

        const code = generateVerificationCode()
        const expiresMs = ms(process.env.JWT_VERIFY_EMAIL_EXPIRES as StringValue || '10m')
        const expires = new Date(Date.now() + expiresMs)

        await prisma.emailVerificationCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt: expires,
            },
        })

        await sendVerificationEmail(user.email, code)

        const newToken = signVerifyEmailToken({ userId: user.id })

        res.cookie('verify_email_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: expiresMs,
            sameSite: 'lax',
        })

        res.status(200).json({ message: 'Verification code resent. Please check your email.' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Internal server error' })
    }
}

const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })

        res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}


const refreshToken = (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token missing' })
        return
    }

    try {
        const payload = verifyRefreshToken(refreshToken)

        const newAccessToken = signAccessToken({ id: (payload as any).id })

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_ACCESS_EXPIRES as StringValue || '1d'), // 1 dia
        })

        res.status(200).json({ ok: true })
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' })
    }
}


export default {
    login,
    register,
    verifyEmail,
    resendVerification,
    me,
    refreshToken,
    logout
}
