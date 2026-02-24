import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth-client'
import { Auth } from './Auth'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'

export function Login() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    setStatus('pending')
    setError(null)

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    })

    if (authError) {
      setStatus('error')
      if (authError.status === 401 || authError.message?.includes('Invalid')) {
        setError('Invalid email or password')
        setShowSignup(true)
      } else {
        setError(authError.message || 'Sign in failed')
      }
      return
    }

    setStatus('success')
    await router.invalidate()
    router.navigate({ to: '/documents' })
  }

  async function handleSignup(e: React.MouseEvent) {
    e.preventDefault()
    const form = (e.target as HTMLElement).closest('form')
    if (!form) return

    const formData = new FormData(form)
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
      actionText="Sign In"
      status={status}
      onSubmit={handleLogin}
      afterSubmit={
        error ? (
          <div className="space-y-3 mt-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {showSignup ? (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={handleSignup}
                type="button"
              >
                Sign up instead?
              </Button>
            ) : null}
          </div>
        ) : null
      }
    />
  )
}
