// middlewares/authenticateJWT.ts
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.accessToken

    if (!token) {
        res.status(401).json({ error: 'Access token missing' })
        return
    }

    try {
        const payload = verifyAccessToken(token)
        req.user = payload
        
        next()
    } catch (err) {
        res.status(401).json({ error: 'Access token invalid or expired' })
        return
    }
}
