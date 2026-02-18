import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Fullstack TypeScript Template
        </h1>
        <p className="text-xl text-muted-foreground">
          A production-ready starter with authentication, file storage,
          API keys, and an admin panel. Built with TanStack Start,
          Drizzle ORM, and PostgreSQL.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          {user ? (
            <Button asChild size="lg">
              <Link to="/documents">Go to Documents</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-5xl space-y-8">
        <h2 className="text-2xl font-semibold text-center">
          What's Included
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
              <CardDescription>
                Session-based auth with signup, login, and role-based access
                control. Supports User and Admin roles out of the box.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Storage</CardTitle>
              <CardDescription>
                S3-compatible file storage with presigned uploads and downloads.
                Works with MinIO locally and any S3 provider in production.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Panel</CardTitle>
              <CardDescription>
                Built-in admin area for managing users, API keys, and documents.
                Role-guarded routes with full CRUD operations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-semibold">Ready to start?</h2>
          <p className="text-muted-foreground">
            Create an account and explore the features.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
