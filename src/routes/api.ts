import { Router } from 'express'
import helloController from '../controllers/helloController'
import userController from '../controllers/userController'

const router = Router()

router.get('/', helloController.getHello)
router.get('/users', userController.index)

export default router
