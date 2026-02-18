import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation } from '../hooks/useMutation'
import { loginFn } from '../routes/_authed'
import { Auth } from './Auth'
import { signupFn } from '~/routes/signup'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'

export function Login() {
  const router = useRouter()

  const loginMutation = useMutation({
    fn: loginFn,
    onSuccess: async (ctx) => {
      if (!ctx.data?.error) {
        await router.invalidate()
        router.navigate({ to: '/documents' })
        return
      }
    },
  })

  const signupMutation = useMutation({
    fn: useServerFn(signupFn),
  })

  return (
    <Auth
      actionText="Sign In"
      status={loginMutation.status}
      onSubmit={(e) => {
        const formData = new FormData(e.target as HTMLFormElement)

        loginMutation.mutate({
          data: {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
          },
        })
      }}
      afterSubmit={
        loginMutation.data ? (
          <div className="space-y-3 mt-4">
            <Alert variant="destructive">
              <AlertDescription>{loginMutation.data.message}</AlertDescription>
            </Alert>
            {loginMutation.data.userNotFound ? (
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={(e) => {
                  const formData = new FormData(
                    (e.target as HTMLButtonElement).form!,
                  )

                  signupMutation.mutate({
                    data: {
                      email: formData.get('email') as string,
                      password: formData.get('password') as string,
                    },
                  })
                }}
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
