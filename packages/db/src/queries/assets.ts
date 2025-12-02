import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../drizzle";
import { assets, projectAssets } from "../schema";
import type {
  AssetRow,
  CreateAssetInput,
  AssetType,
  AssetRole,
  ProjectAssetRow,
  ProjectAssetWithDetails,
  AddAssetToProjectInput,
} from "../types";

export async function createAsset(input: CreateAssetInput): Promise<AssetRow> {
  const db = getDb();

  const result = await db
    .insert(assets)
    .values({
      userId: input.user_id ?? null,
      type: input.type,
      name: input.name,
      s3Key: input.s3_key,
      metadata: input.metadata ?? {},
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to create asset");
  }

  return toAssetRow(row);
}

export async function getAsset(id: string): Promise<AssetRow | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1);

  const row = result[0];
  return row ? toAssetRow(row) : null;
}

export async function getAssetByKey(s3Key: string): Promise<AssetRow | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.s3Key, s3Key))
    .limit(1);

  const row = result[0];
  return row ? toAssetRow(row) : null;
}

export async function getUserAssets(
  userId: string,
  type?: AssetType
): Promise<AssetRow[]> {
  const db = getDb();

  const conditions = [eq(assets.userId, userId)];
  if (type) {
    conditions.push(eq(assets.type, type));
  }

  const result = await db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(desc(assets.createdAt));

  return result.map(toAssetRow);
}

export async function getProjectAssets(
  projectId: string,
  role?: AssetRole
): Promise<ProjectAssetWithDetails[]> {
  const db = getDb();

  const conditions = [eq(projectAssets.projectId, projectId)];
  if (role) {
    conditions.push(eq(projectAssets.role, role));
  }

  const result = await db
    .select({
      projectAsset: projectAssets,
      asset: assets,
    })
    .from(projectAssets)
    .innerJoin(assets, eq(projectAssets.assetId, assets.id))
    .where(and(...conditions))
    .orderBy(projectAssets.displayOrder);

  return result.map(({ projectAsset, asset }) => ({
    id: asset.id,
    user_id: asset.userId,
    type: asset.type,
    name: asset.name,
    s3_key: asset.s3Key,
    metadata: (asset.metadata ?? {}) as Record<string, unknown>,
    created_at: asset.createdAt.toISOString(),
    role: projectAsset.role,
    display_order: projectAsset.displayOrder ?? 0,
  }));
}

export async function getAssetsByType(type: AssetType): Promise<AssetRow[]> {
  const db = getDb();

  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.type, type))
    .orderBy(desc(assets.createdAt));

  return result.map(toAssetRow);
}

export async function addAssetToProject(
  input: AddAssetToProjectInput
): Promise<ProjectAssetRow> {
  const db = getDb();

  const result = await db
    .insert(projectAssets)
    .values({
      projectId: input.project_id,
      assetId: input.asset_id,
      role: input.role ?? null,
      displayOrder: input.display_order ?? 0,
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to add asset to project");
  }

  return toProjectAssetRow(row);
}

export async function removeAssetFromProject(
  projectId: string,
  assetId: string
): Promise<void> {
  const db = getDb();

  await db
    .delete(projectAssets)
    .where(
      and(
        eq(projectAssets.projectId, projectId),
        eq(projectAssets.assetId, assetId)
      )
    );
}

export async function updateProjectAsset(
  projectId: string,
  assetId: string,
  updates: { role?: AssetRole; display_order?: number }
): Promise<ProjectAssetRow> {
  const db = getDb();

  const updateData: Partial<typeof projectAssets.$inferInsert> = {};
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.display_order !== undefined)
    updateData.displayOrder = updates.display_order;

  const result = await db
    .update(projectAssets)
    .set(updateData)
    .where(
      and(
        eq(projectAssets.projectId, projectId),
        eq(projectAssets.assetId, assetId)
      )
    )
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to update project asset");
  }

  return toProjectAssetRow(row);
}

export async function deleteAsset(id: string): Promise<void> {
  const db = getDb();

  await db.delete(assets).where(eq(assets.id, id));
}

export async function deleteAssetByKey(s3Key: string): Promise<void> {
  const db = getDb();

  await db.delete(assets).where(eq(assets.s3Key, s3Key));
}

// Helper to convert Drizzle row to legacy AssetRow format
function toAssetRow(row: typeof assets.$inferSelect): AssetRow {
  return {
    id: row.id,
    user_id: row.userId,
    type: row.type,
    name: row.name,
    s3_key: row.s3Key,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.createdAt.toISOString(),
  };
}

// Helper to convert Drizzle row to legacy ProjectAssetRow format
function toProjectAssetRow(
  row: typeof projectAssets.$inferSelect
): ProjectAssetRow {
  return {
    id: row.id,
    project_id: row.projectId,
    asset_id: row.assetId,
    role: row.role,
    display_order: row.displayOrder ?? 0,
    created_at: row.createdAt.toISOString(),
  };
}
