// src/controllers/contactRequestController.ts

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


async function friends(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const userId = req.user.id

    try {
        const contacts = await prisma.contactRequest.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            include: {
                sender: true,
                receiver: true,
            },
        })

        const friends = contacts.map(cr =>
            cr.senderId === userId ? cr.receiver : cr.sender
        )

        res.json(friends)
    } catch (err) {
      res.status(500).json({ error: 'Error retrieving contacts' })
    }
}
async function send(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const senderId = req.user.id
    const { receiverId } = req.body

    if (!receiverId) {
        res.status(400).json({ error: 'Receiver ID is required' })
        return
    }

    if (receiverId === senderId) {
        res.status(400).json({ error: 'You cannot send a request to yourself' })
        return
    }

    try {
        const existing = await prisma.contactRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
                status: {
                    in: ['PENDING', 'ACCEPTED'],
                },
            },
        })

        if (existing) {
            const msg =
                existing.status === 'PENDING'
                    ? 'Request already sent'
                    : 'You are already friends'
            res.status(409).json({ error: msg })
            return
        }

        const request = await prisma.contactRequest.create({
            data: {
                senderId,
                receiverId,
            },
        })

        res.json(request)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Listar solicitudes recibidas
async function received(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    try {
        const requests = await prisma.contactRequest.findMany({
            where: {
                receiverId: req.user.id,
                status: 'PENDING',
            },
                include: {
                sender: true,
            },
        })

        res.json(requests)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

  // Aceptar solicitud
async function accept(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const { id } = req.params

    try {
        const request = await prisma.contactRequest.findUnique({
            where: { id: Number(id) },
        })

        if (!request || request.receiverId !== req.user.id || request.status !== 'PENDING') {
            res.status(404).json({ error: 'Request not found or not authorized' })
            return
        }

        const updated = await prisma.contactRequest.update({
            where: { id: Number(id) },
            data: { status: 'ACCEPTED' },
        })

        res.json(updated)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Rechazar solicitud
async function reject(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const { id } = req.params

    try {
        const request = await prisma.contactRequest.findUnique({
            where: { id: Number(id) },
        })

        if (!request || request.receiverId !== req.user.id || request.status !== 'PENDING') {
            res.status(404).json({ error: 'Request not found or not authorized' })
            return
        }

        const updated = await prisma.contactRequest.update({
            where: { id: Number(id) },
            data: { status: 'REJECTED' },
        })

        res.json(updated)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function cancel(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const { id } = req.params

    try {
        const request = await prisma.contactRequest.findUnique({
            where: { id: Number(id) },
        })

        if (!request || request.senderId !== req.user.id || request.status !== 'PENDING') {
            res.status(404).json({ error: 'Request not found or not authorized to cancel' })
            return
        }

        await prisma.contactRequest.delete({
            where: { id: Number(id) },
        })

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}


export default {
    friends, 
    send,
    received,
    accept,
    reject,
    cancel
}
