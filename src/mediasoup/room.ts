// mediasoup/room.ts
import { WebRtcTransport } from 'mediasoup/node/lib/types'
import { getMediasoupRouter } from './server'

interface Peer {
    userId: number
    transports: WebRtcTransport[]
    producers: any[]
    consumers: any[]
}

const rooms = new Map<string, Map<number, Peer>>() // roomId -> Map<userId, Peer>

export function getRoomIdOfUser(userId: number): string | undefined {
    for (const [roomId, peers] of rooms.entries()) {
        if (peers.has(userId)) return roomId
    }
}

export async function createWebRtcTransport(userId: number, roomId: string) {
    const router = getMediasoupRouter()
    const transport = await router.createWebRtcTransport({
        listenIps: [
            {
                ip: '0.0.0.0', // Acepta conexiones desde cualquier IP
                announcedIp: process.env.ANNOUNCED_IP, // Importante: IP pública para WebRTC
            },
        ], // -> In prod change for your server ip
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    })

    if (!rooms.has(roomId)) rooms.set(roomId, new Map())

    const roomPeers = rooms.get(roomId)!
    if (!roomPeers.has(userId)) {
        roomPeers.set(userId, {
            userId,
            transports: [],
            producers: [],
            consumers: [],
        })
    }

    roomPeers.get(userId)!.transports.push(transport)

    return {
        transport,
        params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        },
    }
}

export function getTransport(userId: number, transportId: string): WebRtcTransport | undefined {
    for (const room of rooms.values()) {
        const peer = room.get(userId)
        const transport = peer?.transports.find(t => t.id === transportId)
        if (transport) return transport
    }
    return undefined
}

export function getProducer(producerId: string) {
    for (const room of rooms.values()) {
        for (const peer of room.values()) {
            const producer = peer.producers.find(p => p.id === producerId)
            if (producer) return producer
        }
    }
    return undefined
}

export function addProducer(userId: number, producer: any) {
    for (const room of rooms.values()) {
        const peer = room.get(userId)
        if (peer) {
            peer.producers.push(producer)
            return
        }
    }
}
