import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schemas
const conversationIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID').transform(Number)
})

const createConversationSchema = z.object({
    isGroup: z.boolean(),
    title: z.string().optional(),
    participantIds: z.array(z.number().int()).min(1)
})

// GET /conversations
const index = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                participants: {
                    include: { 
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                     }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        res.status(200).json(conversations)
    } catch (e) {
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// GET /conversations/:id
const find = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const { id } = conversationIdSchema.parse(req.params)

        const conversation = await prisma.conversation.findUnique({
            where: { id },  
            include: {
                participants: { include: { 
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                }},
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    }}
                }
            }
        })

        if (!conversation) {
            res.status(404).send('Conversation not found')
            return
        }

        const isParticipant = conversation.participants.some(p => p.userId === userId)
        if (!isParticipant) {
            res.status(403).json({ error: 'Access denied' })
            return
        }

        res.status(200).json(conversation)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

const store = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const data = createConversationSchema.parse(req.body)

        // Aseguramos que el creador esté en la lista de participantes
        const allParticipantIds = Array.from(new Set([userId, ...data.participantIds]))

        const conversation = await prisma.conversation.create({
            data: {
                isGroup: data.isGroup,
                title: data.title,
                creatorId: userId,   // <-- acá asignás quién creó la conversación
                participants: {
                    create: allParticipantIds.map(uid => ({ userId: uid }))
                }
            },
            include: {
                participants: { include: { user: true } }
            }
        })

        res.status(201).json(conversation)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}


const update = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const { id } = conversationIdSchema.parse(req.params)
        const { title } = z.object({ title: z.string() }).parse(req.body)

        // Buscamos la conversación y su creatorId
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            select: { creatorId: true }
        })

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' })
            return
        }

        // Validamos que solo el creador pueda actualizar
        if (conversation.creatorId !== userId) {
            res.status(403).json({ error: 'Only the creator can update this conversation' })
            return
        }

        // Actualizamos el título
        const updated = await prisma.conversation.update({
            where: { id },
            data: { title }
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

const destroy = async (req: Request, res: Response) => {
    try {
        // Validar autenticación
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const { id } = conversationIdSchema.parse(req.params)

        // Obtener la conversación con creatorId y participantes
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                creator: true,
                participants: true
            }
        })

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' })
            return
        }

        if (conversation.creatorId === userId) {
            // Si es el creador, elimina la conversación para todos
            await prisma.conversation.delete({ where: { id } })
            res.status(204).send()
            return
        }

        // Si no es el creador, "elimina" la conversación solo para este participante (borrado suave)
        const participant = conversation.participants.find(p => p.userId === userId)

        if (!participant) {
            res.status(403).json({ error: 'Access denied: you are not a participant' })
            return
        }

        if (participant.deletedAt) {
            // Ya "eliminó" antes, solo responder ok
            res.status(204).send()
            return
        }

        await prisma.participant.update({
            where: { id: participant.id },
            data: { deletedAt: new Date() }
        })

        res.status(204).send()
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
    find,
    store,
    update,
    destroy
}
