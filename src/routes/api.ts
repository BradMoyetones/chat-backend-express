import { Router } from 'express'
import helloController from '../controllers/helloController'
import userController from '../controllers/userController'
import authController from '../controllers/authController'
import { authenticateJWT } from '../middlewares/authenticateJWT'

const router = Router()

router.get('/', helloController.getHello)

router.get('/me', authenticateJWT, authController.me)
router.post('/login', authController.login)

// Users routes (protegidas)
router.get('/users', authenticateJWT, userController.index)
router.get('/users/:id', authenticateJWT, userController.find)
router.put('/users/:id', authenticateJWT, userController.update)
router.delete('/users/:id', authenticateJWT, userController.destroy)

// Ruta pública (crear usuario)
router.post('/users', userController.store)

export default router
