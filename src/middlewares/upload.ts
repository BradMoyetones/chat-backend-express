import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Asegurarse de que el directorio exista
const uploadsDir = path.join(__dirname, '../../public/uploads/profile')
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`
        cb(null, uniqueName)
    },
})

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
})
