import { useState } from 'react'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { fetchAllDocuments, adminDeleteDocument } from '~/utils/admin'
import { Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authed/admin/documents/')({
  loader: () => fetchAllDocuments(),
  component: AdminDocumentsPage,
})

function AdminDocumentsPage() {
  const documents = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Documents</h2>

      {documents.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No documents found.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Title</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Owner</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">File</th>
                <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">Created</th>
                <th className="h-10 px-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDelete={async () => {
                    await adminDeleteDocument({ data: { documentId: doc.id } })
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

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: {
    id: string
    title: string
    fileName: string | null
    fileSize: number | null
    createdAt: Date
    userEmail: string | null
  }
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="border-b">
      <td className="h-12 px-4 text-sm">
        <Link
          to="/documents/$documentId"
          params={{ documentId: doc.id }}
          className="hover:underline text-primary"
        >
          {doc.title}
        </Link>
      </td>
      <td className="h-12 px-4 text-sm text-muted-foreground">{doc.userEmail || 'Unknown'}</td>
      <td className="h-12 px-4 text-sm text-muted-foreground">
        {doc.fileName || 'No file'}
      </td>
      <td className="h-12 px-4 text-sm text-muted-foreground">
        {new Date(doc.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
      <td className="h-12 px-4 text-right">
        {confirmDelete ? (
          <div className="flex justify-end gap-1">
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
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
      </td>
    </tr>
  )
}
