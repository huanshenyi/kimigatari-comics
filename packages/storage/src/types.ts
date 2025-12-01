/**
 * Storage configuration for S3-compatible services
 */
export interface StorageConfig {
  /** S3 endpoint URL (MinIO: http://localhost:9000, AWS: https://s3.region.amazonaws.com) */
  endpoint: string;
  /** AWS region (use 'us-east-1' for MinIO) */
  region: string;
  /** S3 bucket name */
  bucket: string;
  /** Access key ID */
  accessKeyId: string;
  /** Secret access key */
  secretAccessKey: string;
  /** Force path style URLs (required for MinIO) */
  forcePathStyle?: boolean;
  /** Public URL base for serving files (optional, uses endpoint if not set) */
  publicUrlBase?: string;
}

/**
 * Asset types supported by the storage system
 *
 * - generated: AI生成画像（生成履歴）
 * - character: キャラクター参照画像
 * - background: シーン背景素材
 * - reference: その他の参照画像
 */
export type AssetType = "generated" | "character" | "background" | "reference";

/**
 * Metadata for stored assets
 */
export interface AssetMetadata {
  id: string;
  name: string;
  type: AssetType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  projectId?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  metadata: Partial<AssetMetadata>;
}

/**
 * Options for listing assets
 */
export interface ListAssetsOptions {
  prefix?: string;
  type?: AssetType;
  projectId?: string;
  maxKeys?: number;
  continuationToken?: string;
}

/**
 * Result of listing assets
 */
export interface ListAssetsResult {
  assets: Array<{
    key: string;
    url: string;
    size: number;
    lastModified: Date;
  }>;
  continuationToken?: string;
  isTruncated: boolean;
}
