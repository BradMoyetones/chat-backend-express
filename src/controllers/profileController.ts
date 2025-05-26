import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const updateSchema = z
    .object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        password: z.string().min(6, 'Current password is required').optional(),
        newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
        repeatPassword: z.string().min(6, 'Repeat password must be at least 6 characters').optional(),
    })
    .refine(data => {
        if (data.newPassword || data.repeatPassword) {
            return data.newPassword === data.repeatPassword
        }
        return true
    }, {
        message: "Passwords don't match",
        path: ['repeatPassword'],
    })
    .refine(data => {
        if (data.newPassword || data.repeatPassword) {
            return !!data.password
        }
        return true
    }, {
        message: "Current password is required to change password",
        path: ['password'],
})


const updateInformation = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const { firstName, lastName, password, newPassword } = updateSchema.parse(req.body)

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        // Si quiere cambiar contraseña, verificamos la actual
        if (newPassword) {
            const isValid = await bcrypt.compare(password || '', user.password)
            if (!isValid) {
                res.status(400).json({ error: 'Current password is incorrect' })
                return
            }
        }

        const updateData: any = {
            firstName,
            lastName,
        }

        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10)
        }

        const userUpdated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        })

        res.status(200).json({ user: userUpdated, message: 'Profile updated successfully' })
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal server error')
    }
}


export default {
    updateInformation
}