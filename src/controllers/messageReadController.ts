import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Zod Schemas
const messageIdParamSchema = z.object({
    messageId: z.string().regex(/^\d+$/).transform(Number)
})

const markReadSchema = z.object({
    userId: z.number().int().positive()
})

// POST /messages/:messageId/read
const store = async (req: Request, res: Response) => {
    try {
        const { messageId } = messageIdParamSchema.parse(req.params)
        const { userId } = markReadSchema.parse(req.body)

        const existing = await prisma.messageRead.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId
                }
            }
        })

        if (existing) {
            res.status(200).json({ message: 'Already read', data: existing })
            return
        }

        const read = await prisma.messageRead.create({
            data: {
                messageId,
                userId
            },
            include: {
                user: true
            }
        })

        res.status(201).json(read)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }

        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// GET /messages/:messageId/readers
const index = async (req: Request, res: Response) => {
    try {
        const { messageId } = messageIdParamSchema.parse(req.params)

        const readers = await prisma.messageRead.findMany({
            where: { messageId },
            include: {
                user: true
            }
        })

        res.status(200).json(readers)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }

        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

    export default {
    store,
    index
}
