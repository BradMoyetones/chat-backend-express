import { Socket } from 'socket.io'
import { getMediasoupRouter } from './server'
import {
  addProducer,
  createWebRtcTransport,
  getTransport,
  getRoomIdOfUser,
} from './room'

export function registerMediasoupHandlers(socket: Socket) {
    const router = getMediasoupRouter()

    socket.on('mediasoup:getRouterRtpCapabilities', (_, callback) => {
        callback(router.rtpCapabilities)
    })

    socket.on('mediasoup:crear-transporte', async ({ roomId }, callback) => {
        if (!socket.data.userId) return callback({ error: 'Usuario no autenticado' })

        try {
            const { transport, params } = await createWebRtcTransport(socket.data.userId, roomId)

            // unir socket a la sala (importante para emitir a otros)
            socket.join(roomId)

            callback({ params })
        } catch (err) {
            console.error('Error creando transporte WebRTC:', err)
            callback({ error: 'Error creando transporte' })
        }
    })

    socket.on('mediasoup:conectar-transporte', async ({ transportId, dtlsParameters }, callback) => {
        if (!socket.data.userId) return callback({ error: 'Usuario no autenticado' })

        try {
            const transport = getTransport(socket.data.userId, transportId)
            if (!transport) return callback({ error: 'Transporte no encontrado' })

            await transport.connect({ dtlsParameters })
            callback({ conectado: true })
        } catch (error) {
            console.error('Error conectando transporte:', error)
            callback({ error: 'Error conectando transporte' })
        }
    })

    socket.on('mediasoup:produce', async ({ transportId, kind, rtpParameters }, callback) => {
        if (!socket.data.userId) return callback({ error: 'Usuario no autenticado' })

        try {
            const transport = getTransport(socket.data.userId, transportId)
            if (!transport) return callback({ error: 'Transporte no encontrado' })

            const producer = await transport.produce({ kind, rtpParameters })

            // Guardar producer
            addProducer(socket.data.userId, producer)

            callback({ id: producer.id })

            // Obtener la sala del usuario
            const roomId = getRoomIdOfUser(socket.data.userId)
            if (!roomId) return

            // Notificar a los demás sockets en la sala sobre el nuevo producer
            socket.to(roomId).emit('mediasoup:nuevo-producer', {
                producerId: producer.id,
                kind: producer.kind,
                userId: socket.data.userId,
            })

        } catch (err) {
            console.error('Error al producir:', err)
            callback({ error: 'Error al producir' })
        }
    })

    socket.on('mediasoup:consume', async ({ producerId, transportId, rtpCapabilities }, callback) => {
        if (!socket.data.userId) return callback({ error: 'Usuario no autenticado' })

        try {
            const router = getMediasoupRouter()

            // Verificar si el router puede consumir
            if (!router.canConsume({ producerId, rtpCapabilities })) {
                return callback({ error: 'No se puede consumir este producer' })
            }

            const transport = getTransport(socket.data.userId, transportId)
            if (!transport) return callback({ error: 'Transporte no encontrado' })

            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: false,
            })

            callback({
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            })

        } catch (err) {
            console.error('Error creando consumer:', err)
            callback({ error: 'Error creando consumer' })
        }
    })
}
