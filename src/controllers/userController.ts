import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Schemas Zod
const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number)
})

const userBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
})

// GET /users
const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany()
    res.status(200).json(users)
  } catch (e) {
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

// GET /users/search?q=...
const search = async (req: Request, res: Response) => {
  try {
    // Validar usuario autenticado
    if (!req.user || typeof req.user === 'string') {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const userId = req.user.id

    // Validar query param `q`
    const schema = z.object({
      q: z.string().min(1, 'Search query is required'),
    })

    const { q } = schema.parse(req.query)

    // Buscar usuarios por nombre, apellido o email
    const results = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { firstName: { contains: q} },
          { lastName: { contains: q} },
          { email: { contains: q} },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        sentRequests: {
          where: { receiverId: userId },
          select: { id: true, status: true },
        },
        receivedRequests: {
          where: { senderId: userId },
          select: { id: true, status: true },
        },
      },
      take: 20,
    })


    res.status(200).json(results)
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors })
      return
    }

    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

// GET /users/:id
const find = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar param id
    const { id } = userIdSchema.parse(req.params)

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      res.status(404).send('User not found')
      return
    }

    res.status(200).json(user)
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors })
      return
    }
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

// POST /users
const store = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = userBodySchema.parse(req.body)

    // Encriptar contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      }
    })

    res.status(201).json(newUser)
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors })
      return
    }
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

// PUT /users/:id
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar param id y body
    const { id } = userIdSchema.parse(req.params)
    const data = userBodySchema.parse(req.body)

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    })

    res.status(200).json(updatedUser)
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors })
      return
    }
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

// DELETE /users/:id
const destroy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = userIdSchema.parse(req.params)

    await prisma.user.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors })
      return
    }
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
}

export default {
  search,
  index,
  find,
  store,
  update,
  destroy
}
