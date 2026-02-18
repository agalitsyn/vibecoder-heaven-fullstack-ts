// src/services/session.server.ts
import { useSession } from '@tanstack/react-start/server'
import type { InferSelectModel } from 'drizzle-orm'
import type { users } from '~/db/schema'

type User = InferSelectModel<typeof users>

type SessionUser = {
  userId: User['id']
}

export function useAppSession() {
  return useSession<SessionUser>({
    password: 'ChangeThisBeforeShippingToProdOrYouWillBeFired',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}
