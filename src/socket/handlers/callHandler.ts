// socket/handlers/callHandler.ts
import { Socket } from "socket.io"
import { onlineUsers } from "../../server"
import { emitToUser } from "../../lib/socketHelpers"
import { registerMediasoupHandlers } from "../../mediasoup/handlers"

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
    registerMediasoupHandlers(socket)

}
