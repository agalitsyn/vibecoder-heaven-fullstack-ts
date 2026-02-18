import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, users, userApiKeys, documents } from '~/db'
import { useAppSession } from './session'
import { hashPassword } from '~/db'
import { deleteFile } from './s3'

async function requireAdmin(): Promise<string> {
  const session = await useAppSession()
  const userId = session.data.userId

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (user.length === 0 || user[0].role !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return userId
}

// Users CRUD
export const fetchAllUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
})

export const fetchUserById = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)

    if (user.length === 0) {
      throw new Error('User not found')
    }

    return user[0]
  })

export const adminCreateUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { email: string; password: string; role: 'USER' | 'ADMIN' }) => input
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (existing.length > 0) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await hashPassword(data.password)

    const result = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        role: data.role,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })

    return result[0]
  })

export const adminUpdateUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { userId: string; email?: string; role?: 'USER' | 'ADMIN'; password?: string }) =>
      input
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const updates: Record<string, unknown> = {}
    if (data.email) updates.email = data.email
    if (data.role) updates.role = data.role
    if (data.password) updates.password = await hashPassword(data.password)

    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, data.userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })

    if (result.length === 0) {
      throw new Error('User not found')
    }

    return result[0]
  })

export const adminDeleteUser = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    const currentUserId = await requireAdmin()

    if (data.userId === currentUserId) {
      throw new Error('Cannot delete your own account')
    }

    await db.delete(users).where(eq(users.id, data.userId))

    return { success: true }
  })

// API Keys management
export const fetchAllApiKeys = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return db
    .select({
      id: userApiKeys.id,
      title: userApiKeys.title,
      prefix: userApiKeys.prefix,
      createdAt: userApiKeys.createdAt,
      lastUsedAt: userApiKeys.lastUsedAt,
      revoked: userApiKeys.revoked,
      userId: userApiKeys.userId,
      userEmail: users.email,
    })
    .from(userApiKeys)
    .leftJoin(users, eq(userApiKeys.userId, users.id))
    .orderBy(desc(userApiKeys.createdAt))
})

export const adminRevokeApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { keyId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    await db.update(userApiKeys).set({ revoked: true }).where(eq(userApiKeys.id, data.keyId))

    return { success: true }
  })

export const adminDeleteApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { keyId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    await db.delete(userApiKeys).where(eq(userApiKeys.id, data.keyId))

    return { success: true }
  })

// Documents management
export const fetchAllDocuments = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      fileContentType: documents.fileContentType,
      fileSize: documents.fileSize,
      fileKey: documents.fileKey,
      createdAt: documents.createdAt,
      userId: documents.userId,
      userEmail: users.email,
    })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id))
    .orderBy(desc(documents.createdAt))
})

export const adminDeleteDocument = createServerFn({ method: 'POST' })
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    const doc = await db
      .select({ fileKey: documents.fileKey })
      .from(documents)
      .where(eq(documents.id, data.documentId))
      .limit(1)

    if (doc.length > 0 && doc[0].fileKey) {
      await deleteFile(doc[0].fileKey)
    }

    await db.delete(documents).where(eq(documents.id, data.documentId))

    return { success: true }
  })
