const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3001', // o '*' si estás probando
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

// Middleware para json (no estrictamente necesario si solo usas sockets)
app.use(express.json())

// Endpoint básico "Hola mundo"
app.get('/', (req, res) => {
    res.send('Hola mundo desde Express')
})

// Evento para nueva conexión socket
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id)

    socket.on('mensaje:nuevo', (mensaje) => {
        console.log('Mensaje recibido:', mensaje)

        // reenviar a todos (incluyendo al que envió)
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


const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
