import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { fetchUserDocuments } from '~/utils/documents'
import { Plus, FileText, Calendar } from 'lucide-react'

export const Route = createFileRoute('/_authed/documents/')({
  loader: () => fetchUserDocuments(),
  component: DocumentsListPage,
})

function DocumentsListPage() {
  const documents = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your documents and files</p>
        </div>
        <Button asChild>
          <Link to="/documents/new">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first document to get started.
            </p>
            <Button asChild>
              <Link to="/documents/new">
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to="/documents/$documentId"
              params={{ documentId: doc.id }}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {doc.fileName && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{doc.fileName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
