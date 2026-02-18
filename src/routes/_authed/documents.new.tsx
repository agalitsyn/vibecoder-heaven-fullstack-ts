import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { FileDropzone } from '~/components/ui/file-dropzone'
import {
  createDocument,
  getDocumentUploadUrl,
  updateDocument,
} from '~/utils/documents'
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  ALLOWED_EXTENSIONS_LABEL,
} from '~/utils/s3'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/documents/new')({
  component: NewDocumentPage,
})

function NewDocumentPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const doc = await createDocument({ data: { title: title.trim() } })

      if (selectedFile) {
        setUploadProgress(10)

        const { uploadUrl, fileKey } = await getDocumentUploadUrl({
          data: {
            documentId: doc.id,
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            fileSize: selectedFile.size,
          },
        })

        setUploadProgress(30)

        await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: { 'Content-Type': selectedFile.type },
        })

        setUploadProgress(80)

        await updateDocument({
          data: {
            id: doc.id,
            fileKey,
            fileName: selectedFile.name,
            fileContentType: selectedFile.type,
            fileSize: selectedFile.size,
          },
        })

        setUploadProgress(100)
      }

      router.navigate({
        to: '/documents/$documentId',
        params: { documentId: doc.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Document</h1>
          <p className="text-muted-foreground">Create a new document with an optional file</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>File (optional)</Label>
              <FileDropzone
                accept={ALLOWED_CONTENT_TYPES}
                maxSize={MAX_FILE_SIZE}
                maxSizeLabel={MAX_FILE_SIZE_LABEL}
                allowedTypesLabel={ALLOWED_EXTENSIONS_LABEL}
                onFileSelect={(file) => setSelectedFile(file)}
                uploading={uploading}
                progress={uploadProgress}
                currentFile={
                  selectedFile ? { filename: selectedFile.name } : undefined
                }
                onRemove={() => setSelectedFile(null)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={uploading || !title.trim()}>
                {uploading ? 'Creating...' : 'Create Document'}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/documents">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
