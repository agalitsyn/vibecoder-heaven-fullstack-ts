import { useState } from 'react'
import { Copy, Key, Trash2, Ban, Check, AlertTriangle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export type ProfileUser = {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
}

export type ApiKeyInfo = {
  id: string
  title: string
  prefix: string
  createdAt: Date
  lastUsedAt: Date | null
  revoked: boolean
}

type ProfilePageProps = {
  user: ProfileUser
  apiKeys: ApiKeyInfo[]
  onCreateKey: (title: string) => Promise<{
    success: boolean
    key?: string
    keyInfo?: ApiKeyInfo
    error?: string
  }>
  onRevokeKey: (keyId: string) => Promise<{ success: boolean; error?: string }>
  onDeleteKey: (keyId: string) => Promise<{ success: boolean; error?: string }>
}

const roleLabels: Record<ProfileUser['role'], string> = {
  USER: 'User',
  ADMIN: 'Administrator',
}

export function ProfilePage({
  user,
  apiKeys,
  onCreateKey,
  onRevokeKey,
  onDeleteKey,
}: ProfilePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-sm">{roleLabels[user.role]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registered</p>
              <p className="text-sm">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ApiKeysSection
        keys={apiKeys}
        onCreateKey={onCreateKey}
        onRevokeKey={onRevokeKey}
        onDeleteKey={onDeleteKey}
      />
    </div>
  )
}

type ApiKeysSectionProps = {
  keys: ApiKeyInfo[]
  onCreateKey: (title: string) => Promise<{
    success: boolean
    key?: string
    keyInfo?: ApiKeyInfo
    error?: string
  }>
  onRevokeKey: (keyId: string) => Promise<{ success: boolean; error?: string }>
  onDeleteKey: (keyId: string) => Promise<{ success: boolean; error?: string }>
}

function ApiKeysSection({ keys, onCreateKey, onRevokeKey, onDeleteKey }: ApiKeysSectionProps) {
  const [newKeyTitle, setNewKeyTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyTitle.trim()) return

    setCreating(true)
    setError(null)
    try {
      const result = await onCreateKey(newKeyTitle.trim())
      if (result.success && result.key) {
        setNewlyCreatedKey(result.key)
        setNewKeyTitle('')
      } else {
        setError(result.error || 'Failed to create key')
      }
    } catch {
      setError('Error creating key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevokeKey(keyId: string) {
    setError(null)
    try {
      const result = await onRevokeKey(keyId)
      if (!result.success) {
        setError(result.error || 'Failed to revoke key')
      }
    } catch {
      setError('Error revoking key')
    }
  }

  async function handleDeleteKey(keyId: string) {
    setError(null)
    try {
      const result = await onDeleteKey(keyId)
      if (!result.success) {
        setError(result.error || 'Failed to delete key')
      }
    } catch {
      setError('Error deleting key')
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } catch {
      setError('Failed to copy key')
    }
  }

  function closeNewKeyAlert() {
    setNewlyCreatedKey(null)
    setCopiedKey(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Manage API keys for programmatic access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {newlyCreatedKey && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Key created successfully
            </AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="text-green-700 dark:text-green-300">
                Copy the key now. It won't be shown again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm font-mono break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                >
                  {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeNewKeyAlert}>
                Got it
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateKey} className="flex gap-2">
          <Input
            type="text"
            placeholder="Key name"
            value={newKeyTitle}
            onChange={(e) => setNewKeyTitle(e.target.value)}
            className="flex-1"
            disabled={creating}
          />
          <Button type="submit" disabled={creating || !newKeyTitle.trim()}>
            {creating ? 'Creating...' : 'Create Key'}
          </Button>
        </form>

        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You don't have any API keys yet
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <ApiKeyRow
                key={key.id}
                apiKey={key}
                onRevoke={() => handleRevokeKey(key.id)}
                onDelete={() => handleDeleteKey(key.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ApiKeyRowProps = {
  apiKey: ApiKeyInfo
  onRevoke: () => void
  onDelete: () => void
}

function ApiKeyRow({ apiKey, onRevoke, onDelete }: ApiKeyRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        apiKey.revoked ? 'opacity-60 bg-muted' : 'bg-card'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{apiKey.title}</p>
          {apiKey.revoked && (
            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded">
              Revoked
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-mono">{apiKey.prefix}</p>
        <div className="text-xs text-muted-foreground mt-1 space-x-4">
          <span>
            Created:{' '}
            {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {apiKey.lastUsedAt && (
            <span>
              Last used:{' '}
              {new Date(apiKey.lastUsedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!apiKey.revoked && (
          <Button type="button" variant="outline" size="sm" onClick={onRevoke} title="Revoke key">
            <Ban className="h-4 w-4" />
          </Button>
        )}
        {confirmDelete ? (
          <>
            <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            title="Delete key"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
