import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, users, userApiKeys } from '~/db'
import { useAppSession } from '~/utils/session'
import { ProfilePage, type ProfileUser, type ApiKeyInfo } from '~/components/profile/ProfilePage'
import {
  createApiKey,
  revokeApiKey,
  deleteApiKey,
} from '~/utils/api-keys'

const fetchProfileUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ProfileUser | null> => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return null
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return null
    }

    return user[0]
  }
)

const fetchApiKeys = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ApiKeyInfo[]> => {
    const session = await useAppSession()
    const userId = session.data.userId

    if (!userId) {
      return []
    }

    return db
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
  }
)

export const Route = createFileRoute('/_authed/profile')({
  loader: async () => {
    const user = await fetchProfileUser()
    if (!user) {
      throw new Error('User not found')
    }

    const apiKeys = await fetchApiKeys()

    return { user, apiKeys }
  },
  component: ProfilePageRoute,
})

function ProfilePageRoute() {
  const { user, apiKeys } = Route.useLoaderData()
  const router = useRouter()

  const handleCreateKey = async (title: string) => {
    const result = await createApiKey({ data: { title } })
    if (result.success) {
      router.invalidate()
    }
    return result
  }

  const handleRevokeKey = async (keyId: string) => {
    const result = await revokeApiKey({ data: { keyId } })
    if (result.success) {
      router.invalidate()
    }
    return result
  }

  const handleDeleteKey = async (keyId: string) => {
    const result = await deleteApiKey({ data: { keyId } })
    if (result.success) {
      router.invalidate()
    }
    return result
  }

  return (
    <ProfilePage
      user={user}
      apiKeys={apiKeys}
      onCreateKey={handleCreateKey}
      onRevokeKey={handleRevokeKey}
      onDeleteKey={handleDeleteKey}
    />
  )
}
