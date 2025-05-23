import { Router } from 'express'
import helloController from '../controllers/helloController'
import userController from '../controllers/userController'
import authController from '../controllers/authController'

import conversationController from '../controllers/conversationController'
import participantController from '../controllers/participantController'
import messageController from '../controllers/messageController'
import messageReadController from '../controllers/messageReadController'
import contactRequestController from '../controllers/contactRequestController'

import { authenticateJWT } from '../middlewares/authenticateJWT'

const router = Router()

router.get('/', helloController.getHello)

router.post('/auth/login', authController.login)
router.post('/auth/refresh', authController.refreshToken)
router.get('/auth/me', authenticateJWT, authController.me)

// Users routes (protegidas)
router.get('/users', authenticateJWT, userController.index)
router.get('/users/search', authenticateJWT, userController.search)
router.get('/users/:id', authenticateJWT, userController.find)
router.put('/users/:id', authenticateJWT, userController.update)
router.delete('/users/:id', authenticateJWT, userController.destroy)


// Conversations
router.get('/conversations', authenticateJWT, conversationController.index)
router.get('/conversations/:id', authenticateJWT, conversationController.find)
router.post('/conversations', authenticateJWT, conversationController.store)
router.put('/conversations/:id', authenticateJWT, conversationController.update)
router.delete('/conversations/:id', authenticateJWT, conversationController.destroy)

// Participants
router.get('/participants', authenticateJWT, participantController.index)
router.get('/participants/:id', authenticateJWT, participantController.find)
router.post('/participants', authenticateJWT, participantController.store)
router.delete('/participants/:id', authenticateJWT, participantController.destroy)

// Messages
router.get('/conversations/:conversationId/messages', authenticateJWT, messageController.index)
router.post('/conversations/:conversationId/messages', authenticateJWT, messageController.store)

// Mensajes individuales
router.patch('/messages/:id', authenticateJWT, messageController.update)
router.patch('/messages/:id/delete', authenticateJWT, messageController.softDelete)

// Message Reads (visto/entregado)
router.post('/message-reads', authenticateJWT, messageReadController.markAsRead)

// Ruta pública (crear usuario)
router.post('/users', userController.store)

// Solicitudes
router.get('/contacts', authenticateJWT, contactRequestController.friends)
router.get('/contacts/request', authenticateJWT, contactRequestController.received)
router.post('/contacts/request', authenticateJWT, contactRequestController.send)
router.post('/contacts/request/:id/accept', authenticateJWT, contactRequestController.accept)
router.post('/contacts/request/:id/reject', authenticateJWT, contactRequestController.reject)
router.delete('/contacts/request/:id/delete', authenticateJWT, contactRequestController.cancel)

export default router
