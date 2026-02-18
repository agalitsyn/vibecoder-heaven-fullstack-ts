import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, hashPassword, users } from './index'

async function main() {
  const hashedPassword = await hashPassword('admin')

  const existing = await db.query.users.findFirst({
    where: eq(users.email, 'admin@example.com'),
  })

  if (!existing) {
    await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    })
    console.log('Admin user created')
  } else {
    await db
      .update(users)
      .set({ password: hashedPassword, role: 'ADMIN' })
      .where(eq(users.email, 'admin@example.com'))
    console.log('Admin user password updated')
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
