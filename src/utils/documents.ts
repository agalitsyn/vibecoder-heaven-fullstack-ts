import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { db, documents, users } from '~/db'
import { useAppSession } from './session'
import {
  buildFileKey,
  getUploadUrl as s3GetUploadUrl,
  getDownloadUrl as s3GetDownloadUrl,
  deleteFile,
  validateFileType,
  validateFileSize,
} from './s3'

export const fetchUserDocuments = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      throw new Error('Not authenticated')
    }

    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
  }
)

export const fetchDocumentById = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
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

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, data.id))
      .limit(1)

    if (doc.length === 0) {
      throw new Error('Document not found')
    }

    if (doc[0].userId !== userId && user[0]?.role !== 'ADMIN') {
      throw new Error('Access denied')
    }

    return doc[0]
  })

export const createDocument = createServerFn({ method: 'POST' })
  .inputValidator((input: { title: string }) => input)
  .handler(async ({ data }) => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      throw new Error('Not authenticated')
    }

    if (!data.title.trim()) {
      throw new Error('Title is required')
    }

    const result = await db
      .insert(documents)
      .values({
        title: data.title.trim(),
        userId,
      })
      .returning()

    return result[0]
  })

export const updateDocument = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      id: string
      title?: string
      fileKey?: string | null
      fileName?: string | null
      fileContentType?: string | null
      fileSize?: number | null
    }) => input
  )
  .handler(async ({ data }) => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      throw new Error('Not authenticated')
    }

    const doc = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.id), eq(documents.userId, userId)))
      .limit(1)

    if (doc.length === 0) {
      throw new Error('Document not found or access denied')
    }

    const updates: Record<string, unknown> = {}
    if (data.title !== undefined) updates.title = data.title.trim()
    if (data.fileKey !== undefined) updates.fileKey = data.fileKey
    if (data.fileName !== undefined) updates.fileName = data.fileName
    if (data.fileContentType !== undefined) updates.fileContentType = data.fileContentType
    if (data.fileSize !== undefined) updates.fileSize = data.fileSize

    const result = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, data.id))
      .returning()

    return result[0]
  })

export const deleteDocument = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      throw new Error('Not authenticated')
    }

    const doc = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.id), eq(documents.userId, userId)))
      .limit(1)

    if (doc.length === 0) {
      throw new Error('Document not found or access denied')
    }

    if (doc[0].fileKey) {
      await deleteFile(doc[0].fileKey)
    }

    await db.delete(documents).where(eq(documents.id, data.id))

    return { success: true }
  })

export const getDocumentUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { documentId: string; fileName: string; contentType: string; fileSize: number }) =>
      input
  )
  .handler(async ({ data }) => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      throw new Error('Not authenticated')
    }

    const doc = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.documentId), eq(documents.userId, userId)))
      .limit(1)

    if (doc.length === 0) {
      throw new Error('Document not found or access denied')
    }

    if (!validateFileType(data.contentType)) {
      throw new Error('File type not allowed')
    }

    if (!validateFileSize(data.fileSize)) {
      throw new Error('File too large')
    }

    const fileKey = buildFileKey(data.documentId, data.fileName)
    const uploadUrl = await s3GetUploadUrl(fileKey, data.contentType)

    return { uploadUrl, fileKey }
  })

export const getDocumentDownloadUrl = createServerFn({ method: 'GET' })
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data }) => {
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

    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, data.documentId))
      .limit(1)

    if (doc.length === 0) {
      throw new Error('Document not found')
    }

    if (doc[0].userId !== userId && user[0]?.role !== 'ADMIN') {
      throw new Error('Access denied')
    }

    if (!doc[0].fileKey) {
      throw new Error('No file attached')
    }

    const downloadUrl = await s3GetDownloadUrl(doc[0].fileKey)

    return { downloadUrl }
  })
