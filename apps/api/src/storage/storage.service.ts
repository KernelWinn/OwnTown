import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class StorageService {
  private readonly s3: S3Client
  private readonly bucket: string

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({ region: config.getOrThrow('AWS_REGION') })
    this.bucket = config.getOrThrow('AWS_S3_BUCKET')
  }

  /** Generate a pre-signed URL for direct upload from client */
  async getUploadUrl(folder: string, mimeType: string): Promise<{ url: string; key: string }> {
    const key = `${folder}/${uuidv4()}`
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    })
    const url = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    return { url, key }
  }

  getPublicUrl(key: string): string {
    const cdnDomain = this.config.get('CLOUDFRONT_DOMAIN')
    if (cdnDomain) return `https://${cdnDomain}/${key}`
    return `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${key}`
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
