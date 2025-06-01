// middlewares/uploadMessageFiles.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request, Response, NextFunction } from 'express'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { conversationId } = req.params
        const dir = path.join(__dirname, `../../private/uploads/conversations/conversation-${conversationId}`)

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, uniqueName + ext)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB por archivo
}).array('attachments', 10)

const uploadFiles = (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message })
        } else if (err) {
            return res.status(500).json({ error: 'Unexpected error while uploading files' })
        }
        next()
    })
}

export default uploadFiles
