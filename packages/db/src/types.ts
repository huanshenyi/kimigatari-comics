import { z } from "zod";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { projects } from "./schema/projects";
import type { pages } from "./schema/pages";
import type { assets } from "./schema/assets";
import type { projectAssets } from "./schema/project-assets";

// Enums
export const projectStatusSchema = z.enum([
  "draft",
  "generating",
  "completed",
  "error",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const assetTypeSchema = z.enum([
  "character",
  "background",
  "generated",
  "reference",
]);
export type AssetType = z.infer<typeof assetTypeSchema>;

export const assetRoleSchema = z.enum([
  "character",
  "background",
  "reference",
]);
export type AssetRole = z.infer<typeof assetRoleSchema>;

// Drizzle inferred types (camelCase)
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
export type Page = InferSelectModel<typeof pages>;
export type NewPage = InferInsertModel<typeof pages>;
export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;
export type ProjectAsset = InferSelectModel<typeof projectAssets>;
export type NewProjectAsset = InferInsertModel<typeof projectAssets>;

// Legacy row types (snake_case) - for backwards compatibility
export interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  plot: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  project_id: string;
  page_number: number;
  layout_data: unknown;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetRow {
  id: string;
  user_id: string | null;
  type: AssetType;
  name: string;
  s3_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProjectAssetRow {
  id: string;
  project_id: string;
  asset_id: string;
  role: AssetRole | null;
  display_order: number;
  created_at: string;
}

// Asset with project association info
export interface ProjectAssetWithDetails extends AssetRow {
  role: AssetRole | null;
  display_order: number;
}

// Supabase Database type (kept for compatibility, but deprecated)
/** @deprecated Use Drizzle schema types instead */
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectRow, "id" | "created_at">>;
        Relationships: [];
      };
      pages: {
        Row: PageRow;
        Insert: Omit<PageRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PageRow, "id" | "project_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "pages_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      assets: {
        Row: AssetRow;
        Insert: Omit<AssetRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AssetRow, "id" | "created_at">>;
        Relationships: [];
      };
      project_assets: {
        Row: ProjectAssetRow;
        Insert: Omit<ProjectAssetRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ProjectAssetRow, "id" | "project_id" | "asset_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assets_asset_id_fkey";
            columns: ["asset_id"];
            referencedRelation: "assets";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Input/Output types for queries
export interface CreateProjectInput {
  user_id: string;
  title: string;
  plot?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  title?: string;
  plot?: string;
  status?: ProjectStatus;
}

export interface CreatePageInput {
  project_id: string;
  page_number: number;
  layout_data?: unknown;
  image_url?: string | null;
}

export interface UpdatePageInput {
  page_number?: number;
  layout_data?: unknown;
  image_url?: string | null;
}

export interface PageOrder {
  id: string;
  page_number: number;
}

export interface CreateAssetInput {
  user_id?: string | null;
  type: AssetType;
  name: string;
  s3_key: string;
  metadata?: Record<string, unknown>;
}

export interface AddAssetToProjectInput {
  project_id: string;
  asset_id: string;
  role?: AssetRole;
  display_order?: number;
}
