// middlewares/authenticateJWT.ts
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '../utils/jwt'

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.accessToken
    const refreshToken = req.headers['x-refresh-token'] as string | undefined

    
    if (!token) {
        res.status(401).json({ error: 'Access token missing' })
        return
    }

    try {
        const payload = verifyAccessToken(token)
        req.user = payload
        next()
    } catch (err: any) {
        if (err.name === 'TokenExpiredError' && refreshToken) {
            console.log(refreshToken);
            
            try {
                const refreshPayload = verifyRefreshToken(refreshToken)
                const newAccessToken = signAccessToken({ id: (refreshPayload as any).id })

                // ✅ Seteamos nuevamente la cookie de accessToken
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    maxAge: 60 * 15, // 15 minutos
                })

                req.user = refreshPayload
                next()
            } catch {
                res.status(401).json({ error: 'Refresh token invalid' })
            }
        } else {
            res.status(401).json({ error: 'Access token invalid or missing' })
        }
    }
}
