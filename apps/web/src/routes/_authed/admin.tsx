import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Users, Key, FileText, LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin')({
  beforeLoad: ({ context }) => {
    const user = context.user as { id: string; email: string; role?: string | null } | null
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required')
    }
  },
  errorComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You need administrator privileges to access this area.</p>
      <Button asChild>
        <Link to="/documents">Go to Documents</Link>
      </Button>
    </div>
  ),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, API keys, and documents</p>
      </div>

      <nav className="flex gap-2 border-b pb-4">
        <Link to="/admin">
          {({ isActive }) => (
            <Button variant={isActive ? 'secondary' : 'ghost'} size="sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          )}
        </Link>
        <Link to="/admin/users">
          {({ isActive }) => (
            <Button variant={isActive ? 'secondary' : 'ghost'} size="sm">
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
          )}
        </Link>
        <Link to="/admin/api-keys">
          {({ isActive }) => (
            <Button variant={isActive ? 'secondary' : 'ghost'} size="sm">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </Button>
          )}
        </Link>
        <Link to="/admin/documents">
          {({ isActive }) => (
            <Button variant={isActive ? 'secondary' : 'ghost'} size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
          )}
        </Link>
      </nav>

      <Outlet />
    </div>
  )
}
