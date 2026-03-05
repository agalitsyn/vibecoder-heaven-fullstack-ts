import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { fetchAllUsers, fetchAllApiKeys, fetchAllDocuments } from '~/utils/admin'
import { Users, Key, FileText } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin/')({
  loader: async () => {
    const [users, apiKeys, documents] = await Promise.all([
      fetchAllUsers(),
      fetchAllApiKeys(),
      fetchAllDocuments(),
    ])
    return {
      userCount: users.length,
      apiKeyCount: apiKeys.length,
      documentCount: documents.length,
    }
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { userCount, apiKeyCount, documentCount } = Route.useLoaderData()

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Keys</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{apiKeyCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{documentCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
