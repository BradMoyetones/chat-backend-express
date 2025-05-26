import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt'
import { z } from 'zod'
import ms, { StringValue } from 'ms'

const prisma = new PrismaClient()

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
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

        // Si pasa validación, crea un objeto sin password para enviar
        const { password: _, ...userWithoutPassword } = user

        const accessToken = signAccessToken({ id: user.id })
        const refreshToken = signRefreshToken({ id: user.id })

        // Seteamos cookies con las opciones recomendadas
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_ACCESS_EXPIRES as StringValue || '1d'), // 1 dia
        })

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // o true si no necesitás leerlo en frontend
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES as StringValue || '7d'), // 7 días en ms
        })

        // Enviamos solo el user en el body (sin tokens)
        res.status(200).json({ user: userWithoutPassword })
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
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
    me,
    refreshToken,
    logout
}
