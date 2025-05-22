import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { io } from '../server'

const prisma = new PrismaClient()

const markAsRead = async (req: Request, res: Response) => {
    try {
        if (!req.user || typeof req.user === 'string') {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const userId = req.user.id
        const { messageIds } = req.body

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            res.status(400).json({ error: 'Invalid messageIds' })
            return
        }

        // Obtener los mensajes para saber la conversación
        const messages = await prisma.message.findMany({
            where: { id: { in: messageIds } },
            select: { id: true, conversationId: true },
        })

        const conversationId = messages[0]?.conversationId

        const data = messageIds.map((id) => ({
            messageId: id,
            userId: userId,
        }))

        await prisma.messageRead.createMany({
            data,
            skipDuplicates: true,
        })

        // Emitir por socket a la sala de esa conversación
        if (conversationId) {
            io.to(`conversation:${conversationId}`).emit("mensaje:leido", {
                messageIds,
                userId,
                conversationId,
            })
        }

        res.status(200).json({ success: true })
    } catch (e) {
        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

export default {
    markAsRead,
}
