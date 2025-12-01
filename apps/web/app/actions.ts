"use server";

import { createStorageClient, type AssetType } from "@kimigatari/storage";

// Create storage client instance
const storage = createStorageClient();

// Valid asset types
const validTypes: AssetType[] = [
  "generated",
  "character",
  "background",
  "reference",
];

// Allowed mime types for uploads
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * List assets
 */
export async function listAssets(params: {
  type?: AssetType;
  projectId?: string;
  limit?: number;
  cursor?: string;
}) {
  try {
    const result = await storage.list({
      type: params.type,
      projectId: params.projectId,
      maxKeys: params.limit || 100,
      continuationToken: params.cursor,
    });

    return {
      success: true,
      assets: result.assets,
      nextCursor: result.continuationToken,
      hasMore: result.isTruncated,
    };
  } catch (error) {
    console.error("Error listing assets:", error);
    return { success: false, error: "Failed to list assets" };
  }
}

/**
 * Upload asset (for smaller files via FormData)
 */
export async function uploadAsset(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as AssetType | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !type) {
      return { success: false, error: "file and type are required" };
    }

    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "File too large. Maximum size is 10MB.",
      };
    }

    // Check mime type
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`,
      };
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const result = await storage.upload(buffer, file.name, type, {
      projectId: projectId || undefined,
      mimeType: file.type,
    });

    return {
      success: true,
      key: result.key,
      url: result.publicUrl,
      size: buffer.length,
      mimeType: file.type,
      type,
      projectId,
    };
  } catch (error) {
    console.error("Error uploading asset:", error);
    return { success: false, error: "Failed to upload asset" };
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(key: string) {
  try {
    if (!key) {
      return { success: false, error: "key is required" };
    }

    // Check if asset exists
    const exists = await storage.exists(key);
    if (!exists) {
      return { success: false, error: "Asset not found" };
    }

    await storage.delete(key);

    return { success: true, message: "Asset deleted", key };
  } catch (error) {
    console.error("Error deleting asset:", error);
    return { success: false, error: "Failed to delete asset" };
  }
}

/**
 * Get pre-signed URL for upload
 */
export async function getUploadUrl(params: {
  filename: string;
  type: AssetType;
  projectId?: string;
  mimeType?: string;
}) {
  try {
    const { filename, type, projectId, mimeType } = params;

    if (!filename || !type) {
      return { success: false, error: "filename and type are required" };
    }

    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      };
    }

    const result = await storage.getUploadUrl(filename, type, {
      projectId,
      mimeType,
      expiresIn: 3600,
    });

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    };
  } catch (error) {
    console.error("Error getting upload URL:", error);
    return { success: false, error: "Failed to get upload URL" };
  }
}

/**
 * Get pre-signed URL for download
 */
export async function getDownloadUrl(key: string) {
  try {
    if (!key) {
      return { success: false, error: "key is required" };
    }

    // Check if asset exists
    const exists = await storage.exists(key);
    if (!exists) {
      return { success: false, error: "Asset not found" };
    }

    const downloadUrl = await storage.getDownloadUrl(key, 3600);

    return { success: true, downloadUrl, key };
  } catch (error) {
    console.error("Error getting download URL:", error);
    return { success: false, error: "Failed to get download URL" };
  }
}
