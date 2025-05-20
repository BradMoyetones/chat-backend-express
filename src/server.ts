import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import app from './app'

const server = http.createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket: Socket) => {
  console.log('Usuario conectado:', socket.id)

  socket.on('mensaje:nuevo', (mensaje: string) => {
    console.log('Mensaje recibido:', mensaje)

    io.emit('mensaje:recibido', {
      id: socket.id,
      texto: mensaje,
      fecha: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id)
  })
})

const PORT = process.env.PORT || 3003
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
