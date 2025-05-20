import express, { Application } from 'express'
import apiRoutes from './routes/api'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app: Application = express()

app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}))

app.use(express.json())

// Rutas
app.use('/api', apiRoutes)

export default app
