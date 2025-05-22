import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const getUserConversations = async (userId: number): Promise<number[]> => {
    const participations = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
    })

    return participations.map(p => p.conversationId)
}
