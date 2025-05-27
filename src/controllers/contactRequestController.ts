// src/controllers/contactRequestController.ts

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { emitToUser } from '../lib/socketHelpers'
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
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    },
                },
            },
        })

        const friends = contacts.map(cr => ({
            ...cr,
            friend: cr.senderId === userId ? cr.receiver : cr.sender
        }))

        const receivedRequests = await getReceivedRequests(userId)

        res.json({friends, receivedRequests})
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
            include: {
                sender: true,
                receiver: true
            }
        })

        emitToUser(receiverId, 'contact:request:received', request)

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
        const requests = await getReceivedRequests(req.user.id)
        res.json(requests)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Solicitudes recibidas (Callback)
async function getReceivedRequests(userId: number) {
    return prisma.contactRequest.findMany({
        where: {
            receiverId: userId,
            status: 'PENDING',
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    image: true
                }
            },
        },
    })
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
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    }
                }
            }
        })

        if (!request || request.receiverId !== req.user.id || request.status !== 'PENDING') {
            res.status(404).json({ error: 'Request not found or not authorized' })
            return
        }

        const updated = await prisma.contactRequest.update({
            where: { id: Number(id) },
            data: { status: 'ACCEPTED' },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                }
            }
        })

        const toSender = {
            ...updated,
            friend: request.receiver
        }

        const toReceiver = {
            ...updated,
            friend: request.sender
        }

        emitToUser(request.senderId, 'contact:request:accept', toSender)
        emitToUser(request.receiverId, 'contact:request:accept', toReceiver)

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
    const requestId = Number(id)
    if (isNaN(requestId)) {
        res.status(400).json({ error: 'Invalid request ID' })
        return
    }

    const userId = req.user.id

    try {
        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
        })

        if (!request || request.senderId !== userId || request.status !== 'PENDING') {
            res.status(404).json({ error: 'Request not found or not authorized to cancel' })
            return
        }

        await prisma.contactRequest.delete({
            where: { id: requestId },
        })

        emitToUser(request.receiverId, 'contact:request:cancel', request)

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function deleteFriend(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const { id } = req.params
    const requestId = Number(id)
    if (isNaN(requestId)) {
        res.status(400).json({ error: 'Invalid request ID' })
        return
    }

    const userId = req.user.id

    try {
        const request = await prisma.contactRequest.findUnique({
            where: { id: requestId },
        })

        // Verificar que exista, que esté aceptada y que el user sea parte
        if (
            !request ||
            request.status !== 'ACCEPTED' ||
            (request.senderId !== userId && request.receiverId !== userId)
        ) {
            res.status(404).json({ error: 'Friendship not found or not authorized' })
            return
        }

        await prisma.contactRequest.delete({
            where: { id: requestId },
        })

        // Emitimos a ambos que se eliminó la amistad
        emitToUser(request.senderId, 'contact:deleted', request)
        emitToUser(request.receiverId, 'contact:deleted', request)

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
    cancel,
    deleteFriend
}
