import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, user, apikey, documents } from '~/db'
import { requireAdmin } from '~/lib/auth-helpers'
import { auth } from '~/lib/auth'
import { deleteFile } from './s3'

// Users CRUD
export const fetchAllUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
})

export const fetchUserById = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    const result = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1)

    if (result.length === 0) {
      throw new Error('User not found')
    }

    return result[0]
  })

export const adminCreateUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { email: string; password: string; role: 'user' | 'admin'; name?: string }) => input
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    // Use Better Auth API to create user (handles password hashing)
    const newUser = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name || data.email.split('@')[0],
      },
    })

    if (!newUser?.user) {
      throw new Error('Failed to create user')
    }

    // Set role if admin
    if (data.role === 'admin') {
      await db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(user.id, newUser.user.id))
    }

    return {
      id: newUser.user.id,
      email: newUser.user.email,
      name: newUser.user.name,
      role: data.role,
      createdAt: newUser.user.createdAt,
    }
  })

export const adminUpdateUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { userId: string; email?: string; role?: 'user' | 'admin'; password?: string; name?: string }) =>
      input
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const updates: Record<string, unknown> = {}
    if (data.email) updates.email = data.email
    if (data.name) updates.name = data.name
    if (data.role) updates.role = data.role

    // Handle password change through Better Auth
    if (data.password) {
      await auth.api.setPassword({
        body: { newPassword: data.password },
        query: { userId: data.userId },
      })
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(user)
        .set(updates)
        .where(eq(user.id, data.userId))
    }

    const result = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1)

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

    await db.delete(user).where(eq(user.id, data.userId))

    return { success: true }
  })

// API Keys management
export const fetchAllApiKeys = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return db
    .select({
      id: apikey.id,
      name: apikey.name,
      prefix: apikey.prefix,
      start: apikey.start,
      createdAt: apikey.createdAt,
      expiresAt: apikey.expiresAt,
      enabled: apikey.enabled,
      userId: apikey.userId,
      userEmail: user.email,
    })
    .from(apikey)
    .leftJoin(user, eq(apikey.userId, user.id))
    .orderBy(desc(apikey.createdAt))
})

export const adminDeleteApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { keyId: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin()

    await db.delete(apikey).where(eq(apikey.id, data.keyId))

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
      userEmail: user.email,
    })
    .from(documents)
    .leftJoin(user, eq(documents.userId, user.id))
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
