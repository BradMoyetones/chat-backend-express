import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { emitToUser } from '../lib/socketHelpers'

const prisma = new PrismaClient()

// Zod Schemas
const conversationParamSchema = z.object({
  conversationId: z.string().regex(/^\d+$/).transform(Number)
})

const messageIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
})

const messageCreateSchema = z.object({
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
        if (!req.user || typeof req.user === "string") {
            res.status(401).json({ error: "Unauthorized" })
            return
        }

        const userId = req.user.id
        const { conversationId } = conversationParamSchema.parse(req.params)
        const data = messageCreateSchema.parse(req.body)

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: true,
            },
        })

        if (!conversation) {
            res.status(404).json({ error: "Conversation not found" })
            return
        }

        const isParticipant = conversation.participants.some(p => p.userId === userId)
        if (!isParticipant) {
            res.status(403).json({ error: "Access denied" })
            return
        }

        const message = await prisma.message.create({
            data: {
                content: data.content,
                senderId: userId,
                conversationId,
            },
        })

        // Adjuntar archivos si existen
        if (req.files && Array.isArray(req.files)) {
            const attachments = req.files.map(file => {
                const buffer = Buffer.from(file.originalname, 'latin1')
                const correctedName = buffer.toString('utf8')

                return {
                    filename: file.filename,
                    originalName: correctedName,
                    type: file.mimetype,
                    size: file.size,
                    messageId: message.id,
                    userId,
                }
            })


            await prisma.attachment.createMany({
                data: attachments,
            })
        }

        const fullMessage = await prisma.message.findUnique({
            where: { id: message.id },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
                reads: true,
                attachments: true,
            },
        })

        // Emitir mensaje a los participantes
        for (const participant of conversation.participants) {
            emitToUser(participant.userId, 'mensaje:recibido', fullMessage)
        }

        res.status(201).json(fullMessage)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send("Internal Server Error")
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
