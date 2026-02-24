import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, user } from './index'
import { auth } from '../lib/auth'

async function main() {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, 'admin@example.com'),
  })

  if (!existing) {
    const result = await auth.api.signUpEmail({
      body: {
        email: 'admin@example.com',
        password: 'admin',
        name: 'Admin',
      },
    })

    if (!result?.user) {
      throw new Error('Failed to create admin user')
    }

    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.id, result.user.id))

    console.log('Admin user created')
  } else {
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.email, 'admin@example.com'))
    console.log('Admin user role updated')
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
