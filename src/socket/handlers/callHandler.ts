// socket/handlers/callHandler.ts
import { Socket } from "socket.io"
import { onlineUsers } from "../../server"
import { emitToUser } from "../../lib/socketHelpers"

export function registerCallHandlers(socket: Socket) {

    socket.on('call:user', ({ targetUserId, from }) => {
        emitToUser(targetUserId, 'call:incoming', { from })
    })

    socket.on('call:accept', ({ to }) => {
        emitToUser(to, 'call:accepted', { from: socket.data.userId })
    })

    socket.on('call:reject', ({ to }) => {
        emitToUser(to, 'call:rejected', null)
    })

    socket.on('call:end', ({ targetUserId }) => {
        emitToUser(targetUserId, 'call:ended', { from: socket.data.userId })
    })

    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
        emitToUser(targetUserId, 'webrtc:offer', { from: socket.data.userId, offer })
    })

    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
        emitToUser(targetUserId, 'webrtc:answer', { from: socket.data.userId, answer })
    })

    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
        emitToUser(targetUserId, 'webrtc:ice-candidate', { from: socket.data.userId, candidate })
    })
}
