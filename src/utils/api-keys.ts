import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, userApiKeys, users } from '~/db'
import { useAppSession } from './session'

export type ApiKeyInfo = {
  id: string
  title: string
  prefix: string
  createdAt: Date
  lastUsedAt: Date | null
  revoked: boolean
}

async function hashApiKey(key: string): Promise<string> {
  const crypto = await import('node:crypto')
  return crypto.createHash('sha256').update(key).digest('hex')
}

async function generateApiKey(): Promise<{ key: string; prefix: string }> {
  const crypto = await import('node:crypto')
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const key = `sk_${randomBytes}`
  const prefix = `sk_${randomBytes.slice(0, 8)}...`
  return { key, prefix }
}

export const listApiKeys = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ success: boolean; keys?: ApiKeyInfo[]; error?: string }> => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const keys = await db
      .select({
        id: userApiKeys.id,
        title: userApiKeys.title,
        prefix: userApiKeys.prefix,
        createdAt: userApiKeys.createdAt,
        lastUsedAt: userApiKeys.lastUsedAt,
        revoked: userApiKeys.revoked,
      })
      .from(userApiKeys)
      .where(eq(userApiKeys.userId, userId))
      .orderBy(desc(userApiKeys.createdAt))

    return { success: true, keys }
  }
)

export const createApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { title: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; key?: string; keyInfo?: ApiKeyInfo; error?: string }> => {
      const session = await useAppSession()
      const userId = session.data.userId

      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }

      const { title } = data
      if (!title.trim()) {
        return { success: false, error: 'Key name is required' }
      }

      const { key, prefix } = await generateApiKey()
      const hashedKey = await hashApiKey(key)

      const result = await db
        .insert(userApiKeys)
        .values({
          userId,
          title: title.trim(),
          hashedKey,
          prefix,
        })
        .returning({
          id: userApiKeys.id,
          title: userApiKeys.title,
          prefix: userApiKeys.prefix,
          createdAt: userApiKeys.createdAt,
          lastUsedAt: userApiKeys.lastUsedAt,
          revoked: userApiKeys.revoked,
        })

      return {
        success: true,
        key,
        keyInfo: result[0],
      }
    }
  )

export const revokeApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { keyId: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const { keyId } = data

    const keyResult = await db
      .select({ userId: userApiKeys.userId })
      .from(userApiKeys)
      .where(eq(userApiKeys.id, keyId))
      .limit(1)

    if (keyResult.length === 0) {
      return { success: false, error: 'Key not found' }
    }

    if (keyResult[0].userId !== userId) {
      return { success: false, error: 'Access denied' }
    }

    await db.update(userApiKeys).set({ revoked: true }).where(eq(userApiKeys.id, keyId))

    return { success: true }
  })

export const deleteApiKey = createServerFn({ method: 'POST' })
  .inputValidator((input: { keyId: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const { keyId } = data

    const keyResult = await db
      .select({ userId: userApiKeys.userId })
      .from(userApiKeys)
      .where(eq(userApiKeys.id, keyId))
      .limit(1)

    if (keyResult.length === 0) {
      return { success: false, error: 'Key not found' }
    }

    if (keyResult[0].userId !== userId) {
      return { success: false, error: 'Access denied' }
    }

    await db.delete(userApiKeys).where(eq(userApiKeys.id, keyId))

    return { success: true }
  })

export async function validateApiKeyAndGetUser(
  apiKey: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const hashedKey = await hashApiKey(apiKey)

  const result = await db
    .select({
      id: userApiKeys.id,
      userId: userApiKeys.userId,
      revoked: userApiKeys.revoked,
    })
    .from(userApiKeys)
    .where(eq(userApiKeys.hashedKey, hashedKey))
    .limit(1)

  if (result.length === 0) {
    return { valid: false, error: 'Invalid API key' }
  }

  const keyRecord = result[0]

  if (keyRecord.revoked) {
    return { valid: false, error: 'API key has been revoked' }
  }

  await db
    .update(userApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(userApiKeys.id, keyRecord.id))

  return { valid: true, userId: keyRecord.userId }
}

export function getApiKeyFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

export async function getAuthenticatedUser(
  request?: Request
): Promise<{ userId: string | null; authMethod: 'session' | 'api_key' | null }> {
  const session = await useAppSession()
  if (session.data.userId) {
    return { userId: session.data.userId, authMethod: 'session' }
  }

  if (request) {
    const apiKey = getApiKeyFromRequest(request)
    if (apiKey) {
      const result = await validateApiKeyAndGetUser(apiKey)
      if (result.valid && result.userId) {
        return { userId: result.userId, authMethod: 'api_key' }
      }
    }
  }

  return { userId: null, authMethod: null }
}
