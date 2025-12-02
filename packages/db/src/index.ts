// Drizzle Client
export { db, getDb } from "./drizzle";

// Drizzle Schema
export * from "./schema";

// Legacy Supabase Client (kept for auth/realtime features)
export { createServerClient, createBrowserClient, getServerClient } from "./client";

// Types - Drizzle inferred types
export type {
  Project,
  NewProject,
  Page,
  NewPage,
  Asset,
  NewAsset,
  ProjectAsset,
  NewProjectAsset,
} from "./types";

// Types - Legacy (snake_case) for backwards compatibility
export type {
  Database,
  ProjectRow,
  PageRow,
  AssetRow,
  ProjectAssetRow,
  ProjectAssetWithDetails,
  ProjectStatus,
  AssetType,
  AssetRole,
  CreateProjectInput,
  UpdateProjectInput,
  CreatePageInput,
  UpdatePageInput,
  PageOrder,
  CreateAssetInput,
  AddAssetToProjectInput,
} from "./types";

export { projectStatusSchema, assetTypeSchema, assetRoleSchema } from "./types";

// Queries - Projects
export {
  createProject,
  getProject,
  getProjectsByUser,
  updateProject,
  deleteProject,
} from "./queries/projects";

// Queries - Pages
export {
  createPage,
  getPage,
  getProjectPages,
  updatePage,
  updatePageOrder,
  deletePage,
  getNextPageNumber,
} from "./queries/pages";

// Queries - Assets
export {
  createAsset,
  getAsset,
  getAssetByKey,
  getUserAssets,
  getProjectAssets,
  getAssetsByType,
  addAssetToProject,
  removeAssetFromProject,
  updateProjectAsset,
  deleteAsset,
  deleteAssetByKey,
} from "./queries/assets";
