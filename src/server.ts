import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import app from './app'
import { getUserConversations } from './lib/socketHelpers'

const server = http.createServer(app)
process.env.TZ = 'America/Bogota'

export const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

export const onlineUsers = new Map<number, string>() // userId -> socketId

io.on('connection', async (socket: Socket) => {
    console.log('Usuario conectado:', socket.id)

    socket.on('setup', async (userId: number) => {
        console.log(`Usuario ${userId} conectado con socket ${socket.id}`)

        // Guardamos usuario como online
        onlineUsers.set(userId, socket.id)
        socket.broadcast.emit("usuario:online", userId)

        // Guardamos userId en el socket para futuras referencias
        socket.data.userId = userId

        // Unirse a todas las salas de conversación
        const conversationIds = await getUserConversations(userId)
        conversationIds.forEach((convId) => {
            socket.join(`conversation:${convId}`)
        })
    })

    socket.on('mensaje:leido', ({
        messageIds,
        userId,
        conversationId,
    }: {
        messageIds: number[],
        userId: number,
        conversationId: number
    }) => {
        io.to(`conversation:${conversationId}`).emit('mensaje:leido', {
            messageIds,
            userId,
            conversationId,
        })
    })

    // Para saber si un usuario está online (callback desde el frontend)
    socket.on('usuario:estado', (userId: number, callback: (isOnline: boolean) => void) => {
        callback(onlineUsers.has(userId))
    })

    // Cuando alguien se desconecta manualmente (ej. cerrando sesión)
    socket.on("usuario:desconectado", (userId: number) => {
        onlineUsers.delete(userId)
        socket.broadcast.emit("usuario:offline", userId)
    })

    // Amigos online
    socket.on('amigos:online', (ids: number[], callback: (onlineIds: number[]) => void) => {
        const onlineIds = ids.filter(id => onlineUsers.has(id))
        callback(onlineIds)
    })

    socket.on('typing', ({ conversationId, userId }) => {
        socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId });
    });

    socket.on('stopTyping', ({ conversationId, userId }) => {
        socket.to(`conversation:${conversationId}`).emit('stopTyping', { conversationId, userId });
    });



    // Llamar a un usuario
    socket.on('call:user', ({ targetUserId, from }) => {
        const targetSocketId = onlineUsers.get(targetUserId)
        if (targetSocketId) {
            socket.to(targetSocketId).emit('call:incoming', { from })
        }
    })

    // Aceptar llamada
    socket.on('call:accept', ({ to }) => {
        const toSocketId = onlineUsers.get(to)
        if (toSocketId) {
            socket.to(toSocketId).emit('call:accepted', {
                from: socket.data.userId
            })
        }
    })

    // Rechazar llamada
    socket.on('call:reject', ({ to }) => {
        const toSocketId = onlineUsers.get(to)
        if (toSocketId) {
            socket.to(toSocketId).emit('call:rejected')
        }
    })

    // Finalizar llamada
    socket.on('call:end', ({ targetUserId }) => {
        const targetSocketId = onlineUsers.get(targetUserId)
        if (targetSocketId) {
            socket.to(targetSocketId).emit('call:ended', {
                from: socket.data.userId
            })
        }
    })

    

    // Enviar offer del caller al callee
    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
        const targetSocketId = onlineUsers.get(targetUserId)
        if (targetSocketId) {
            socket.to(targetSocketId).emit('webrtc:offer', {
                from: socket.data.userId,
                offer
            })
        }
    })

    // Enviar answer del callee al caller
    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
        const targetSocketId = onlineUsers.get(targetUserId)
        if (targetSocketId) {
            socket.to(targetSocketId).emit('webrtc:answer', {
                from: socket.data.userId,
                answer
            })
        }
    })

    // Enviar ICE candidates
    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
        const targetSocketId = onlineUsers.get(targetUserId)
        if (targetSocketId) {
            socket.to(targetSocketId).emit('webrtc:ice-candidate', {
                from: socket.data.userId,
                candidate
            })
        }
    })



    // Cuando se desconecta automáticamente (ej. se cierra la pestaña)
    socket.on('disconnect', () => {
        const userId = socket.data.userId
        if (userId) {
            onlineUsers.delete(userId)
            socket.broadcast.emit("usuario:offline", userId)
            console.log(`Usuario ${userId} desconectado`)
        } else {
            console.log('Desconexión sin userId asociado')
        }
    })
})

const PORT = process.env.PORT || 3003
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
