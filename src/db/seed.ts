import 'dotenv/config'
import { db, hashPassword } from './index'
import * as schema from './schema'
import { createId } from '@paralleldrive/cuid2'

async function main() {
  const hashedPassword = await hashPassword('password123')

  // Clear existing data
  await db.delete(schema.documents)
  await db.delete(schema.userApiKeys)
  await db.delete(schema.users)

  // Create users
  const now = new Date()
  const users = await db
    .insert(schema.users)
    .values([
      {
        id: createId(),
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER' as const,
        updatedAt: now,
      },
      {
        id: createId(),
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN' as const,
        updatedAt: now,
      },
    ])
    .returning()

  console.log(`Created ${users.length} users`)

  // Create sample documents
  const documents = await db
    .insert(schema.documents)
    .values([
      {
        id: createId(),
        title: 'Getting Started Guide',
        userId: users[0].id,
        updatedAt: now,
      },
      {
        id: createId(),
        title: 'Project Roadmap',
        userId: users[0].id,
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: createId(),
        title: 'Architecture Overview',
        userId: users[0].id,
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: createId(),
        title: 'Admin Notes',
        userId: users[1].id,
        updatedAt: now,
      },
      {
        id: createId(),
        title: 'Deployment Checklist',
        userId: users[1].id,
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ])
    .returning()

  console.log(`Created ${documents.length} documents`)

  console.log('Seed completed!')
  console.log('Test users:')
  console.log('  user@example.com / password123 (USER)')
  console.log('  admin@example.com / password123 (ADMIN)')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
