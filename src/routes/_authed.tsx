import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db, users, hashPassword } from '~/db'
import { eq } from 'drizzle-orm'
import { Login } from '~/components/Login'
import { useAppSession } from '~/utils/session'

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (!user) {
      return {
        error: true,
        userNotFound: true,
        message: 'User not found',
      }
    }

    const hashedPassword = await hashPassword(data.password)

    if (user.password !== hashedPassword) {
      return {
        error: true,
        message: 'Invalid password',
      }
    }

    const session = await useAppSession()

    await session.update({
      userId: user.id,
    })
  })

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw new Error('Authentication required')
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Authentication required') {
      return <Login />
    }

    throw error
  },
})
