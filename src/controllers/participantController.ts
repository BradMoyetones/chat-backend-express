import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schemas
const participantIdSchema = z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
})

const participantBodySchema = z.object({
    userId: z.number().int().positive(),
    conversationId: z.number().int().positive()
})

// GET /participants
const index = async (req: Request, res: Response) => {
    try {
        const participants = await prisma.participant.findMany({
            include: {
                user: true,
                conversation: true
            }
        })

        res.status(200).json(participants)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }

        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// GET /participants/:id
const find = async (req: Request, res: Response) => {
    try {
        const { id } = participantIdSchema.parse(req.params)

        const participant = await prisma.participant.findUnique({
            where: { id },
            include: {
                user: true,
                conversation: true
            }
        })

        if (!participant) {
            res.status(404).send('Participant not found')
            return
        }

        res.status(200).json(participant)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }

        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// POST /participants
const store = async (req: Request, res: Response) => {
    try {
        const data = participantBodySchema.parse(req.body)

        // Opcional: podrías validar si usuario ya es participante para no duplicar

        const participant = await prisma.participant.create({
            data
        })

        res.status(201).json(participant)
    } catch (e) {
        if (e instanceof z.ZodError) {
            res.status(400).json({ error: e.errors })
            return
        }

        console.error(e)
        res.status(500).send('Internal Server Error')
    }
}

// DELETE /participants/:id
const destroy = async (req: Request, res: Response) => {
    try {
        const { id } = participantIdSchema.parse(req.params)

        const participant = await prisma.participant.findUnique({
            where: { id }
        })

        if (!participant) {
            res.status(404).send('Participant not found')
            return
        }

        await prisma.participant.delete({
            where: { id }
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
    destroy
}
