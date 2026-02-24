import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { fetchAllApiKeys, adminDeleteApiKey } from '~/utils/admin'
import { Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin/api-keys')({
  loader: () => fetchAllApiKeys(),
  component: AdminApiKeysPage,
})

function AdminApiKeysPage() {
  const apiKeys = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Keys</h2>

      {apiKeys.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No API keys found.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">User</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Prefix</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Created</th>
                <th className="h-10 px-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <ApiKeyRow
                  key={key.id}
                  apiKey={key}
                  onDelete={async () => {
                    await adminDeleteApiKey({ data: { keyId: key.id } })
                    router.invalidate()
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ApiKeyRow({
  apiKey,
  onDelete,
}: {
  apiKey: {
    id: string
    name: string | null
    prefix: string | null
    start: string | null
    createdAt: Date
    expiresAt: Date | null
    enabled: boolean
    userEmail: string | null
  }
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const displayPrefix = apiKey.start
    ? `${apiKey.prefix || 'sk'}_${apiKey.start}...`
    : apiKey.prefix || '-'

  return (
    <tr className="border-b">
      <td className="h-12 px-4 text-sm">{apiKey.userEmail || 'Unknown'}</td>
      <td className="h-12 px-4 text-sm">{apiKey.name || 'Unnamed'}</td>
      <td className="h-12 px-4 text-sm font-mono text-muted-foreground">{displayPrefix}</td>
      <td className="h-12 px-4 text-sm">
        {!apiKey.enabled ? (
          <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full">
            Disabled
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </td>
      <td className="h-12 px-4 text-sm text-muted-foreground">
        {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
      <td className="h-12 px-4 text-right">
        <div className="flex justify-end gap-1">
          {confirmDelete ? (
            <>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
