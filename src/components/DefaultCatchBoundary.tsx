import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error(error)

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Что-то пошло не так</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription className="mt-2">
              <ErrorComponent error={error} />
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              router.invalidate()
            }}
          >
            Попробовать снова
          </Button>
          {isRoot ? (
            <Button variant="outline" asChild>
              <Link to="/">На главную</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Назад
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
