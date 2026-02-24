import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { Auth } from '~/components/Auth'

export const Route = createFileRoute('/signup')({
  component: SignupComp,
})

function SignupComp() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    setStatus('pending')
    setError(null)

    const { error: authError } = await authClient.signUp.email({
      email,
      password,
      name: email.split('@')[0],
    })

    if (authError) {
      setStatus('error')
      setError(authError.message || 'Sign up failed')
      return
    }

    setStatus('success')
    await router.invalidate()
    router.navigate({ to: '/documents' })
  }

  return (
    <Auth
      actionText="Sign Up"
      status={status}
      onSubmit={handleSignup}
      afterSubmit={
        error ? (
          <div className="text-red-400">{error}</div>
        ) : null
      }
    />
  )
}
