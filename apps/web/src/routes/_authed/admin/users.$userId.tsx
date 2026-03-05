import { useState } from 'react'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { fetchUserById, adminUpdateUser, adminDeleteUser } from '~/utils/admin'
import { ArrowLeft, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin/users/$userId')({
  loader: ({ params }) => fetchUserById({ data: { userId: params.userId } }),
  component: AdminEditUserPage,
})

function AdminEditUserPage() {
  const userData = Route.useLoaderData()
  const router = useRouter()
  const [email, setEmail] = useState(userData.email)
  const [role, setRole] = useState<'user' | 'admin'>(
    (userData.role as 'user' | 'admin') || 'user'
  )
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const data: { userId: string; email?: string; role?: 'user' | 'admin'; password?: string } =
        { userId: userData.id }
      if (email !== userData.email) data.email = email
      if (role !== userData.role) data.role = role
      if (newPassword) data.password = newPassword

      await adminUpdateUser({ data })
      router.invalidate()
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await adminDeleteUser({ data: { userId: userData.id } })
      router.navigate({ to: '/admin/users' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">Edit User</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password (leave blank to keep current)</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Are you sure? This will also delete all their documents and API keys.
              </p>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Yes, delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
