import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import app from './app'
import { getUserConversations } from './lib/socketHelpers'
import { registerCallHandlers } from './socket/handlers/callHandler'
import { initMediasoup } from './mediasoup/server'
import https from 'https'
import fs from 'fs'
import path from 'path'

// const key = fs.readFileSync(path.resolve(__dirname, '../certs/192.168.68.103-key.pem'))
// const cert = fs.readFileSync(path.resolve(__dirname, '../certs/192.168.68.103.pem'))

const server = http.createServer(app)
// const server = https.createServer({ key, cert }, app)
process.env.TZ = 'America/Bogota'

export const io = new SocketIOServer(server, {
    cors: {
        origin: 'https://chat-app-brad.vercel.app',
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

    // Llamadas
    registerCallHandlers(socket)
    await initMediasoup()

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
    console.log(`Servidor corriendo en https://localhost:${PORT}`)
})
