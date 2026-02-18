import { redirect, createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { db, users, hashPassword } from '~/db'
import { eq } from 'drizzle-orm'
import { useMutation } from '~/hooks/useMutation'
import { Auth } from '~/components/Auth'
import { useAppSession } from '~/utils/session'

export const signupFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { email: string; password: string; redirectUrl?: string }) => d,
  )
  .handler(async ({ data }) => {
    const found = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    const password = await hashPassword(data.password)

    const session = await useAppSession()

    if (found) {
      if (found.password !== password) {
        return {
          error: true,
          userExists: true,
          message: 'User already exists',
        }
      }

      await session.update({
        userId: found.id,
      })

      throw redirect({
        href: data.redirectUrl || '/documents',
      })
    }

    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        password,
      })
      .returning()

    await session.update({
      userId: user.id,
    })

    throw redirect({
      href: data.redirectUrl || '/documents',
    })
  })

export const Route = createFileRoute('/signup')({
  component: SignupComp,
})

function SignupComp() {
  const signupMutation = useMutation({
    fn: useServerFn(signupFn),
  })

  return (
    <Auth
      actionText="Sign Up"
      status={signupMutation.status}
      onSubmit={(e) => {
        const formData = new FormData(e.target as HTMLFormElement)

        signupMutation.mutate({
          data: {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
          },
        })
      }}
      afterSubmit={
        signupMutation.data?.error ? (
          <>
            <div className="text-red-400">{signupMutation.data.message}</div>
          </>
        ) : null
      }
    />
  )
}
