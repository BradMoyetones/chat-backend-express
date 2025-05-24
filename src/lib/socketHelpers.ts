import { PrismaClient } from '@prisma/client'
import { io, onlineUsers } from '../server'
const prisma = new PrismaClient()

export const getUserConversations = async (userId: number): Promise<number[]> => {
    const participations = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
    })

    return participations.map(p => p.conversationId)
}

export function emitToUser(userId: number, event: string, data: any) {
    const socketId = onlineUsers.get(userId)
    if (socketId) {
        io.to(socketId).emit(event, data)
    }
}
