import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageConfig,
  UploadResult,
  AssetType,
  ListAssetsOptions,
  ListAssetsResult,
} from "./types.ts";

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig {
  // MINIO_ENDPOINTが設定されていればMinIOを使用（開発環境）
  const useMinIO = process.env.MINIO_ENDPOINT || process.env.NODE_ENV === "development" || !process.env.AWS_ACCESS_KEY_ID;

  if (useMinIO) {
    // MinIO (local development)
    return {
      endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
      region: "us-east-1",
      bucket: process.env.MINIO_BUCKET || "kimigatari-assets",
      accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
      forcePathStyle: true,
      publicUrlBase: process.env.MINIO_PUBLIC_URL || "http://localhost:9000/kimigatari-assets",
    };
  }

  // AWS S3 (production)
  return {
    endpoint: `https://s3.${process.env.AWS_REGION || "ap-northeast-1"}.amazonaws.com`,
    region: process.env.AWS_REGION || "ap-northeast-1",
    bucket: process.env.S3_BUCKET_NAME || "kimigatari-assets",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    forcePathStyle: false,
    publicUrlBase: process.env.CLOUDFRONT_URL || undefined,
  };
}

/**
 * S3-compatible storage client for managing assets
 */
/**
 * Mapping from asset type to S3 prefix
 */
const ASSET_TYPE_PREFIX: Record<AssetType, string> = {
  generated: "generated",
  character: "characters",
  background: "backgrounds",
  reference: "reference",
};

export class StorageClient {
  private client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    });
  }

  /**
   * Get S3 prefix for asset type
   */
  private getPrefix(type: AssetType): string {
    return ASSET_TYPE_PREFIX[type];
  }

  /**
   * Generate a unique key for an asset
   */
  private generateKey(
    filename: string,
    type: AssetType,
    projectId?: string
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const ext = filename.split(".").pop() || "bin";
    const safeName = filename
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 32);

    const parts: string[] = [this.getPrefix(type)];
    if (projectId) {
      parts.push(projectId);
    }
    parts.push(`${safeName}_${timestamp}_${randomId}.${ext}`);

    return parts.join("/");
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key: string): string {
    if (this.config.publicUrlBase) {
      return `${this.config.publicUrlBase}/${key}`;
    }
    if (this.config.forcePathStyle) {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Upload a file to storage
   */
  async upload(
    file: Buffer | Uint8Array | Blob,
    filename: string,
    type: AssetType,
    options?: {
      projectId?: string;
      mimeType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    const key = this.generateKey(filename, type, options?.projectId);

    // Convert Blob to Buffer if needed
    let body: Buffer | Uint8Array;
    if (file instanceof Blob) {
      body = new Uint8Array(await file.arrayBuffer());
    } else {
      body = file;
    }

    const mimeType = options?.mimeType || this.guessMimeType(filename);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      Metadata: {
        ...options?.metadata,
        "x-asset-type": type,
        ...(options?.projectId && { "x-project-id": options.projectId }),
      },
    });

    await this.client.send(command);

    return {
      key,
      url: `s3://${this.config.bucket}/${key}`,
      publicUrl: this.getPublicUrl(key),
      metadata: {
        type,
        mimeType,
        size: body.length,
        projectId: options?.projectId,
      },
    };
  }

  /**
   * Get a pre-signed URL for uploading
   */
  async getUploadUrl(
    filename: string,
    type: AssetType,
    options?: {
      projectId?: string;
      mimeType?: string;
      expiresIn?: number;
    }
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const key = this.generateKey(filename, type, options?.projectId);
    const mimeType = options?.mimeType || this.guessMimeType(filename);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        "x-asset-type": type,
        ...(options?.projectId && { "x-project-id": options.projectId }),
      },
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn || 3600,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /**
   * Get a pre-signed URL for downloading
   */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Delete an asset
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * List assets
   */
  async list(options?: ListAssetsOptions): Promise<ListAssetsResult> {
    let prefix = options?.prefix || "";
    if (options?.type && !prefix) {
      prefix = `${this.getPrefix(options.type)}/`;
    }
    if (options?.projectId && options?.type) {
      prefix = `${this.getPrefix(options.type)}/${options.projectId}/`;
    }

    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix || undefined,
      MaxKeys: options?.maxKeys || 100,
      ContinuationToken: options?.continuationToken,
    });

    const response = await this.client.send(command);

    const assets = (response.Contents || []).map((item) => ({
      key: item.Key!,
      url: this.getPublicUrl(item.Key!),
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));

    return {
      assets,
      continuationToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
    };
  }

  /**
   * Check if an asset exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Guess MIME type from filename
   */
  private guessMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      json: "application/json",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}

/**
 * Create a storage client with default configuration
 */
export function createStorageClient(config?: Partial<StorageConfig>): StorageClient {
  const defaultConfig = getStorageConfig();
  return new StorageClient({ ...defaultConfig, ...config });
}
