import express, { Application } from 'express'
import apiRoutes from './routes/api'
import attachmentRoutes from './routes/attachments'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

const app: Application = express()

app.use(cookieParser())
app.use(cors({
    origin: "https://chat-app-brad.vercel.app",
    credentials: true,
}))

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Rutas
app.use('/api', apiRoutes)
app.use('/api/attachments', attachmentRoutes)

export default app
