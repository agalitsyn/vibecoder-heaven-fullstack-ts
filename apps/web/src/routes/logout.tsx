import { redirect, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

const logoutFn = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  await auth.api.signOut({ headers })

  throw redirect({
    href: '/',
  })
})

export const Route = createFileRoute('/logout')({
  preload: false,
  loader: () => logoutFn(),
})
