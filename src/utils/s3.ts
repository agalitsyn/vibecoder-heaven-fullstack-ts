import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createId } from '@paralleldrive/cuid2'

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin'
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin'
const S3_BUCKET = process.env.S3_BUCKET || 'fullstack-ts'
const S3_REGION = process.env.S3_REGION || 'us-east-1'

let s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    })
  }
  return s3Client
}

let bucketInitialized = false

export async function ensureBucketExists(): Promise<void> {
  if (bucketInitialized) return

  const client = getS3Client()

  try {
    await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
    bucketInitialized = true
  } catch (error: unknown) {
    const awsError = error as { name?: string }
    if (awsError.name === 'NotFound' || awsError.name === 'NoSuchBucket') {
      await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
      bucketInitialized = true
    } else {
      throw error
    }
  }
}

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_EXTENSIONS_LABEL = 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, TXT'

export const MAX_FILE_SIZE_LABEL = '50 MB'

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}

export function buildFileKey(documentId: string, filename: string): string {
  const uniqueId = createId()
  const sanitized = sanitizeFilename(filename)
  return `documents/${documentId}/${uniqueId}-${sanitized}`
}

export async function getUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  await ensureBucketExists()

  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: 15 * 60 })
}

export async function getDownloadUrl(key: string): Promise<string> {
  await ensureBucketExists()

  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn: 60 * 60 })
}

export async function deleteFile(key: string): Promise<void> {
  await ensureBucketExists()

  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  )
}

export function validateFileType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.includes(contentType)
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}
