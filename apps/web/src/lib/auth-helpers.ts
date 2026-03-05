import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'

/**
 * Get the authenticated user's ID from the current request.
 * Throws if not authenticated. For use inside server functions.
 */
export async function requireAuth(): Promise<{ userId: string; role: string | null | undefined }> {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  return { userId: session.user.id, role: session.user.role }
}

/**
 * Get the authenticated user's ID and verify admin role.
 * Throws if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<string> {
  const { userId, role } = await requireAuth()

  if (role !== 'admin') {
    throw new Error('Admin access required')
  }

  return userId
}
