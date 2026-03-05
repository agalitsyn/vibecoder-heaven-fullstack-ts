import { useCallback, useState, useRef } from 'react'
import { Upload, X, File, Loader2 } from 'lucide-react'
import { Button } from './button'
import { cn } from '~/utils/shadcnui'

interface FileDropzoneProps {
  accept: string[]
  maxSize: number
  maxSizeLabel: string
  allowedTypesLabel: string
  onFileSelect: (file: File) => void
  uploading?: boolean
  progress?: number
  currentFile?: { filename: string }
  onRemove?: () => void
  placeholder?: string
  previewUrl?: string
}

export function FileDropzone({
  accept,
  maxSize,
  maxSizeLabel,
  allowedTypesLabel,
  onFileSelect,
  uploading = false,
  progress = 0,
  currentFile,
  onRemove,
  placeholder,
  previewUrl,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptString = accept.join(',')

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!accept.includes(file.type)) {
        return `Invalid file type. Allowed: ${allowedTypesLabel}`
      }
      if (file.size > maxSize) {
        return `File too large. Maximum: ${maxSizeLabel}`
      }
      return null
    },
    [accept, maxSize, maxSizeLabel, allowedTypesLabel]
  )

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      onFileSelect(file)
    },
    [validateFile, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      e.target.value = ''
    },
    [handleFile]
  )

  if (currentFile && !uploading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          <File className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.filename}</p>
            <p className="text-xs text-muted-foreground">Uploaded</p>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {previewUrl && currentFile.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
          <img
            src={previewUrl}
            alt={currentFile.filename}
            className="max-h-60 rounded-lg border"
          />
        )}

        {previewUrl && !currentFile.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <File className="h-4 w-4" />
            Download file
          </a>
        )}

        <Button variant="outline" size="sm" onClick={handleClick}>
          <Upload className="h-4 w-4 mr-2" />
          Replace file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    )
  }

  if (uploading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium mb-2">Uploading...</p>
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-center mb-1">
          {placeholder || 'Drag and drop a file here or click to select'}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          {allowedTypesLabel} (max {maxSizeLabel})
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
