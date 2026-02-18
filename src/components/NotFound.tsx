import { Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-lg">
            {children || 'The page you are looking for does not exist.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
