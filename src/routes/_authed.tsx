import { createFileRoute } from '@tanstack/react-router'
import { Login } from '~/components/Login'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw new Error('Authentication required')
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Authentication required') {
      return <Login />
    }

    throw error
  },
})
