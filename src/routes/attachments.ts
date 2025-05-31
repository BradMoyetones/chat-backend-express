import { Router } from 'express'
import { authenticateJWT } from '../middlewares/authenticateJWT'
import conversationController from '../controllers/conversationController'

const router = Router()

router.get('/:filename', authenticateJWT, conversationController.attachments)

export default router