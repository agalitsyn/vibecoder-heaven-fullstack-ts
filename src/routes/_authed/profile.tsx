import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, user, apikey } from '~/db'
import { requireAuth } from '~/lib/auth-helpers'
import { authClient } from '~/lib/auth-client'
import { ProfilePage, type ProfileUser, type ApiKeyInfo } from '~/components/profile/ProfilePage'

const fetchProfileUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ProfileUser | null> => {
    const { userId } = await requireAuth()

    const result = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]
  }
)

const fetchApiKeys = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ApiKeyInfo[]> => {
    const { userId } = await requireAuth()

    return db
      .select({
        id: apikey.id,
        name: apikey.name,
        prefix: apikey.prefix,
        start: apikey.start,
        createdAt: apikey.createdAt,
        expiresAt: apikey.expiresAt,
        enabled: apikey.enabled,
      })
      .from(apikey)
      .where(eq(apikey.userId, userId))
      .orderBy(desc(apikey.createdAt))
  }
)

export const Route = createFileRoute('/_authed/profile')({
  loader: async () => {
    const profileUser = await fetchProfileUser()
    if (!profileUser) {
      throw new Error('User not found')
    }

    const apiKeys = await fetchApiKeys()

    return { user: profileUser, apiKeys }
  },
  component: ProfilePageRoute,
})

function ProfilePageRoute() {
  const { user: profileUser, apiKeys } = Route.useLoaderData()
  const router = useRouter()

  const handleCreateKey = async (name: string) => {
    const { data, error } = await authClient.apiKey.create({
      name,
      prefix: 'sk',
      expiresIn: undefined, // no expiration
    })

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to create key' }
    }

    router.invalidate()
    return {
      success: true,
      key: data.key,
      keyInfo: {
        id: data.id,
        name: data.name,
        prefix: data.prefix,
        start: data.start,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        enabled: data.enabled,
      },
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    const { error } = await authClient.apiKey.delete({ keyId })

    if (error) {
      return { success: false, error: error.message || 'Failed to delete key' }
    }

    router.invalidate()
    return { success: true }
  }

  return (
    <ProfilePage
      user={profileUser}
      apiKeys={apiKeys}
      onCreateKey={handleCreateKey}
      onDeleteKey={handleDeleteKey}
    />
  )
}
