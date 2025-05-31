// middlewares/uploadMessageFiles.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'

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

const uploadFiles = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por archivo
}).array('attachments', 10) // ACEPTA hasta 10 archivos bajo el campo 'attachments'

export default uploadFiles
