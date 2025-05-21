import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Zod Schemas
const conversationParamSchema = z.object({
  conversationId: z.string().regex(/^\d+$/).transform(Number)
})

const messageIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
})

const messageCreateSchema = z.object({
  senderId: z.number().int().positive(),
  content: z.string().optional().nullable()
})

const messageUpdateSchema = z.object({
  content: z.string().min(1)
})

// GET /conversations/:conversationId/messages
const index = async (req: Request, res: Response) => {
    try {
        const { conversationId } = conversationParamSchema.parse(req.params)

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: true,
                reads: true,
                attachments: true
            }
        })

        res.status(200).json(messages)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// POST /conversations/:conversationId/messages
const store = async (req: Request, res: Response) => {
    try {
        const { conversationId } = conversationParamSchema.parse(req.params)
        const data = messageCreateSchema.parse(req.body)

        const message = await prisma.message.create({
            data: {
                content: data.content,
                senderId: data.senderId,
                conversationId
            },
            include: {
                sender: true,
                reads: true
            }
        })

        res.status(201).json(message)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// PATCH /messages/:id
const update = async (req: Request, res: Response) => {
    try {
        const { id } = messageIdParamSchema.parse(req.params)
        const { content } = messageUpdateSchema.parse(req.body)

        const updated = await prisma.message.update({
            where: { id },
            data: { content },
            include: { sender: true }
        })

        res.status(200).json(updated)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// PATCH /messages/:id/delete
const softDelete = async (req: Request, res: Response) => {
    try {
        const { id } = messageIdParamSchema.parse(req.params)

        const message = await prisma.message.update({
            where: { id },
            data: { deleted: true }
        })

        res.status(200).json({ message: 'Message deleted', data: message })
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
    index,
    store,
    update,
    softDelete
}
