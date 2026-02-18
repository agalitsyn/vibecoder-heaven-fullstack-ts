import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { fetchAllApiKeys, adminRevokeApiKey, adminDeleteApiKey } from '~/utils/admin'
import { Ban, Trash2 } from 'lucide-react'

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
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Title</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Prefix</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Last Used</th>
                <th className="h-10 px-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <ApiKeyRow
                  key={key.id}
                  apiKey={key}
                  onRevoke={async () => {
                    await adminRevokeApiKey({ data: { keyId: key.id } })
                    router.invalidate()
                  }}
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
  onRevoke,
  onDelete,
}: {
  apiKey: {
    id: string
    title: string
    prefix: string | null
    createdAt: Date
    lastUsedAt: Date | null
    revoked: boolean
    userEmail: string | null
  }
  onRevoke: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="border-b">
      <td className="h-12 px-4 text-sm">{apiKey.userEmail || 'Unknown'}</td>
      <td className="h-12 px-4 text-sm">{apiKey.title}</td>
      <td className="h-12 px-4 text-sm font-mono text-muted-foreground">{apiKey.prefix}</td>
      <td className="h-12 px-4 text-sm">
        {apiKey.revoked ? (
          <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full">
            Revoked
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </td>
      <td className="h-12 px-4 text-sm text-muted-foreground">
        {apiKey.lastUsedAt
          ? new Date(apiKey.lastUsedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Never'}
      </td>
      <td className="h-12 px-4 text-right">
        <div className="flex justify-end gap-1">
          {!apiKey.revoked && (
            <Button variant="ghost" size="sm" onClick={onRevoke} title="Revoke">
              <Ban className="h-4 w-4" />
            </Button>
          )}
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
