import { registerApiRoute } from "@mastra/core/server";
import type { Context } from "hono";
import { createStorageClient, type AssetType } from "@kimigatari/storage";

// Create storage client instance
const storage = createStorageClient();

/**
 * GET /assets - List assets
 */
export const listAssetsRoute = registerApiRoute("/assets", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const type = c.req.query("type") as AssetType | undefined;
      const projectId = c.req.query("projectId");
      const maxKeys = parseInt(c.req.query("limit") || "100", 10);
      const continuationToken = c.req.query("cursor");

      const result = await storage.list({
        type,
        projectId,
        maxKeys,
        continuationToken,
      });

      return c.json({
        assets: result.assets,
        nextCursor: result.continuationToken,
        hasMore: result.isTruncated,
      });
    } catch (error) {
      console.error("Error listing assets:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * GET /assets/upload-url - Get pre-signed URL for upload
 */
export const getUploadUrlRoute = registerApiRoute("/assets/upload-url", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const filename = c.req.query("filename");
      const type = c.req.query("type") as AssetType;
      const projectId = c.req.query("projectId");
      const mimeType = c.req.query("mimeType");

      if (!filename || !type) {
        return c.json(
          { error: "filename and type are required" },
          400
        );
      }

      const validTypes: AssetType[] = [
        "character",
        "background",
        "reference",
        "generated",
      ];

      if (!validTypes.includes(type)) {
        return c.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          400
        );
      }

      const result = await storage.getUploadUrl(filename, type, {
        projectId,
        mimeType,
        expiresIn: 3600,
      });

      return c.json({
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * POST /assets/upload - Direct upload (for smaller files)
 */
export const uploadAssetRoute = registerApiRoute("/assets/upload", {
  method: "POST",
  handler: async (c: Context) => {
    try {
      const contentType = c.req.header("content-type") || "";

      if (!contentType.includes("multipart/form-data")) {
        return c.json(
          { error: "Content-Type must be multipart/form-data" },
          400
        );
      }

      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      const type = formData.get("type") as AssetType | null;
      const projectId = formData.get("projectId") as string | null;

      if (!file || !type) {
        return c.json({ error: "file and type are required" }, 400);
      }

      const validTypes: AssetType[] = [
        "character",
        "background",
        "reference",
        "generated",
      ];

      if (!validTypes.includes(type)) {
        return c.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          400
        );
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return c.json(
          { error: "File too large. Maximum size is 10MB." },
          400
        );
      }

      // Check mime type
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!allowedMimeTypes.includes(file.type)) {
        return c.json(
          { error: `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}` },
          400
        );
      }

      const buffer = new Uint8Array(await file.arrayBuffer());

      const result = await storage.upload(buffer, file.name, type, {
        projectId: projectId || undefined,
        mimeType: file.type,
      });

      return c.json({
        key: result.key,
        url: result.publicUrl,
        size: buffer.length,
        mimeType: file.type,
        type,
        projectId,
      });
    } catch (error) {
      console.error("Error uploading asset:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * DELETE /assets/:key - Delete an asset
 */
export const deleteAssetRoute = registerApiRoute("/assets/delete", {
  method: "POST",
  handler: async (c: Context) => {
    try {
      const body = await c.req.json();
      const { key } = body as { key?: string };

      if (!key) {
        return c.json({ error: "key is required" }, 400);
      }

      // Check if asset exists
      const exists = await storage.exists(key);
      if (!exists) {
        return c.json({ error: "Asset not found" }, 404);
      }

      await storage.delete(key);

      return c.json({ message: "Asset deleted", key });
    } catch (error) {
      console.error("Error deleting asset:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * GET /assets/download-url - Get pre-signed URL for download
 */
export const getDownloadUrlRoute = registerApiRoute("/assets/download-url", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const key = c.req.query("key");

      if (!key) {
        return c.json({ error: "key is required" }, 400);
      }

      // Check if asset exists
      const exists = await storage.exists(key);
      if (!exists) {
        return c.json({ error: "Asset not found" }, 404);
      }

      const downloadUrl = await storage.getDownloadUrl(key, 3600);

      return c.json({ downloadUrl, key });
    } catch (error) {
      console.error("Error getting download URL:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

// Export all asset routes
export const assetRoutes = [
  listAssetsRoute,
  getUploadUrlRoute,
  uploadAssetRoute,
  deleteAssetRoute,
  getDownloadUrlRoute,
];
