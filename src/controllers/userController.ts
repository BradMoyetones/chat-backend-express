import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany()
    res.status(200).json(users)
  } catch (e) {
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

export default {
  index,
}
