import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { fetchAllUsers } from '~/utils/admin'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin/users/')({
  loader: () => fetchAllUsers(),
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const users = Route.useLoaderData()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <Button asChild size="sm">
          <Link to="/admin/users/new">
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Role</th>
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Created</th>
              <th className="h-10 px-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="h-12 px-4 text-sm">{u.email}</td>
                <td className="h-12 px-4 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="h-12 px-4 text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="h-12 px-4 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/users/$userId" params={{ userId: u.id }}>
                      Edit
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
