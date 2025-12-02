"use server";

import { createStorageClient, type AssetType } from "@kimigatari/storage";
import {
  createProject as dbCreateProject,
  updateProject as dbUpdateProject,
  deleteProject as dbDeleteProject,
  createPage as dbCreatePage,
  updatePage as dbUpdatePage,
  deletePage as dbDeletePage,
  updatePageOrder,
  getNextPageNumber,
  getUserAssets as dbGetUserAssets,
  getProjectAssets as dbGetProjectAssets,
  getAssetByKey as dbGetAssetByKey,
  createAsset as dbCreateAsset,
  deleteAssetByKey as dbDeleteAssetByKey,
  addAssetToProject as dbAddAssetToProject,
  removeAssetFromProject as dbRemoveAssetFromProject,
  type ProjectRow,
  type PageRow,
  type AssetRow,
  type UpdateProjectInput,
  type UpdatePageInput,
  type PageOrder,
  type AssetRole,
  type ProjectAssetWithDetails,
} from "@kimigatari/db";

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

    // Upload to S3
    const result = await storage.upload(buffer, file.name, type, {
      projectId: projectId || undefined,
      mimeType: file.type,
    });

    // Register asset in DB
    const userId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth
    const asset = await dbCreateAsset({
      user_id: userId,
      type: type,
      name: file.name,
      s3_key: result.key,
      metadata: {
        size: buffer.length,
        mimeType: file.type,
        projectId: projectId || null,
      },
    });

    return {
      success: true,
      key: result.key,
      url: result.publicUrl,
      size: buffer.length,
      mimeType: file.type,
      type,
      projectId,
      assetId: asset.id,
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

    // Check if asset exists in S3
    const exists = await storage.exists(key);
    if (!exists) {
      return { success: false, error: "Asset not found" };
    }

    // Delete from S3
    await storage.delete(key);

    // Delete from DB
    await dbDeleteAssetByKey(key);

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

/**
 * Create a new project
 */
export async function createProject(input: {
  title: string;
  plot?: string;
}): Promise<{ success: boolean; project?: ProjectRow; error?: string }> {
  try {
    // TODO: 認証実装後にユーザーIDを取得
    const userId = "00000000-0000-0000-0000-000000000000";

    const project = await dbCreateProject({
      user_id: userId,
      title: input.title,
      plot: input.plot || "",
    });

    return { success: true, project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<{ success: boolean; project?: ProjectRow; error?: string }> {
  try {
    const project = await dbUpdateProject(id, input);
    return { success: true, project };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbDeleteProject(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

/**
 * Create a new page
 */
export async function createPage(
  projectId: string,
  input?: { layoutData?: unknown; imageUrl?: string }
): Promise<{ success: boolean; page?: PageRow; error?: string }> {
  try {
    const pageNumber = await getNextPageNumber(projectId);

    const page = await dbCreatePage({
      project_id: projectId,
      page_number: pageNumber,
      layout_data: input?.layoutData ?? [],
      image_url: input?.imageUrl ?? null,
    });

    return { success: true, page };
  } catch (error) {
    console.error("Error creating page:", error);
    return { success: false, error: "Failed to create page" };
  }
}

/**
 * Update a page
 */
export async function updatePageAction(
  pageId: string,
  input: UpdatePageInput
): Promise<{ success: boolean; page?: PageRow; error?: string }> {
  try {
    const page = await dbUpdatePage(pageId, input);
    return { success: true, page };
  } catch (error) {
    console.error("Error updating page:", error);
    return { success: false, error: "Failed to update page" };
  }
}

/**
 * Delete a page
 */
export async function deletePageAction(
  pageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbDeletePage(pageId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting page:", error);
    return { success: false, error: "Failed to delete page" };
  }
}

/**
 * Reorder pages
 */
export async function reorderPages(
  projectId: string,
  orders: PageOrder[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await updatePageOrder(projectId, orders);
    return { success: true };
  } catch (error) {
    console.error("Error reordering pages:", error);
    return { success: false, error: "Failed to reorder pages" };
  }
}

// ============================================
// Asset Library Actions (User's Asset Library)
// ============================================

/**
 * Get all assets in user's library
 */
export async function getUserAssets(params?: {
  type?: AssetType;
}): Promise<{
  success: boolean;
  assets?: { key: string; url: string; size: number; lastModified: Date; type?: AssetType; name?: string }[];
  error?: string;
}> {
  try {
    // TODO: 認証実装後にユーザーIDを取得
    const userId = "00000000-0000-0000-0000-000000000000";

    // Get assets from S3 (storage)
    const result = await storage.list({
      type: params?.type,
      maxKeys: 100,
    });

    return {
      success: true,
      assets: result.assets.map((a) => ({
        ...a,
        type: params?.type,
      })),
    };
  } catch (error) {
    console.error("Error getting user assets:", error);
    return { success: false, error: "Failed to get user assets" };
  }
}

// ============================================
// Project Asset Actions (Assets linked to a project)
// ============================================

/**
 * Get assets linked to a specific project
 */
export async function getProjectAssetsAction(
  projectId: string,
  role?: AssetRole
): Promise<{
  success: boolean;
  assets?: ProjectAssetWithDetails[];
  error?: string;
}> {
  try {
    const assets = await dbGetProjectAssets(projectId, role);
    return { success: true, assets };
  } catch (error) {
    console.error("Error getting project assets:", error);
    return { success: false, error: "Failed to get project assets" };
  }
}

/**
 * Get an asset by its S3 key
 */
export async function getAssetByKeyAction(
  s3Key: string
): Promise<{ success: boolean; asset?: AssetRow; error?: string }> {
  try {
    const asset = await dbGetAssetByKey(s3Key);
    if (!asset) {
      return { success: false, error: "Asset not found" };
    }
    return { success: true, asset };
  } catch (error) {
    console.error("Error getting asset by key:", error);
    return { success: false, error: "Failed to get asset" };
  }
}

/**
 * Add an asset to a project
 */
export async function addAssetToProjectAction(
  projectId: string,
  assetId: string,
  role?: AssetRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbAddAssetToProject({
      project_id: projectId,
      asset_id: assetId,
      role,
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding asset to project:", error);
    return { success: false, error: "Failed to add asset to project" };
  }
}

/**
 * Remove an asset from a project
 */
export async function removeAssetFromProjectAction(
  projectId: string,
  assetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbRemoveAssetFromProject(projectId, assetId);
    return { success: true };
  } catch (error) {
    console.error("Error removing asset from project:", error);
    return { success: false, error: "Failed to remove asset from project" };
  }
}
