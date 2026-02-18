import { useState, useEffect } from 'react'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { FileDropzone } from '~/components/ui/file-dropzone'
import {
  fetchDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentUploadUrl,
  getDocumentDownloadUrl,
} from '~/utils/documents'
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  ALLOWED_EXTENSIONS_LABEL,
} from '~/utils/s3'
import { ArrowLeft, Trash2, Download, Save, FileText } from 'lucide-react'

export const Route = createFileRoute('/_authed/documents/$documentId')({
  loader: ({ params }) => fetchDocumentById({ data: { id: params.documentId } }),
  component: DocumentDetailPage,
})

function DocumentDetailPage() {
  const doc = Route.useLoaderData()
  const router = useRouter()
  const [title, setTitle] = useState(doc.title)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    if (doc.fileKey) {
      getDocumentDownloadUrl({ data: { documentId: doc.id } })
        .then(({ downloadUrl }) => setDownloadUrl(downloadUrl))
        .catch(() => {})
    }
  }, [doc.id, doc.fileKey])

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setError(null)
    setSaving(true)

    try {
      await updateDocument({ data: { id: doc.id, title: title.trim() } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(file: File) {
    setError(null)
    setUploading(true)
    setUploadProgress(10)

    try {
      const { uploadUrl, fileKey } = await getDocumentUploadUrl({
        data: {
          documentId: doc.id,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        },
      })

      setUploadProgress(30)

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      setUploadProgress(80)

      await updateDocument({
        data: {
          id: doc.id,
          fileKey,
          fileName: file.name,
          fileContentType: file.type,
          fileSize: file.size,
        },
      })

      setUploadProgress(100)
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleFileRemove() {
    setError(null)
    try {
      await updateDocument({
        data: {
          id: doc.id,
          fileKey: null,
          fileName: null,
          fileContentType: null,
          fileSize: null,
        },
      })
      setDownloadUrl(null)
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove file')
    }
  }

  async function handleDelete() {
    setError(null)
    try {
      await deleteDocument({ data: { id: doc.id } })
      router.navigate({ to: '/documents' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${bytes} B`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
          <p className="text-muted-foreground text-sm">
            Created{' '}
            {new Date(doc.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
              />
              <Button
                onClick={handleSave}
                disabled={saving || title === doc.title || !title.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doc.fileName && doc.fileKey && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.fileContentType}
                  {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                </p>
              </div>
              {downloadUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          )}

          {downloadUrl && doc.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
            <img
              src={downloadUrl}
              alt={doc.fileName}
              className="max-h-60 rounded-lg border"
            />
          )}

          <FileDropzone
            accept={ALLOWED_CONTENT_TYPES}
            maxSize={MAX_FILE_SIZE}
            maxSizeLabel={MAX_FILE_SIZE_LABEL}
            allowedTypesLabel={ALLOWED_EXTENSIONS_LABEL}
            onFileSelect={handleFileUpload}
            uploading={uploading}
            progress={uploadProgress}
            currentFile={
              doc.fileName && doc.fileKey
                ? { filename: doc.fileName }
                : undefined
            }
            onRemove={handleFileRemove}
            previewUrl={downloadUrl || undefined}
            placeholder={
              doc.fileKey
                ? 'Drop a file to replace the current one'
                : 'Drop a file here or click to select'
            }
          />
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
                Are you sure? This cannot be undone.
              </p>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Yes, delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Document
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
