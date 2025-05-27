import express, { Application } from 'express'
import apiRoutes from './routes/api'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

const app: Application = express()

app.use(cookieParser())
app.use(cors({
    origin: true,
    credentials: true,
}))

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Rutas
app.use('/api', apiRoutes)

export default app
