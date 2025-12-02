import { eq, desc } from "drizzle-orm";
import { getDb } from "../drizzle";
import { projects } from "../schema";
import type {
  ProjectRow,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";

export async function createProject(
  input: CreateProjectInput
): Promise<ProjectRow> {
  const db = getDb();

  const result = await db
    .insert(projects)
    .values({
      userId: input.user_id,
      title: input.title,
      plot: input.plot ?? "",
      status: input.status ?? "draft",
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to create project");
  }

  return toProjectRow(row);
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  const row = result[0];
  return row ? toProjectRow(row) : null;
}

export async function getProjectsByUser(userId: string): Promise<ProjectRow[]> {
  const db = getDb();

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return result.map(toProjectRow);
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ProjectRow> {
  const db = getDb();

  const updateData: Partial<typeof projects.$inferInsert> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.plot !== undefined) updateData.plot = input.plot;
  if (input.status !== undefined) updateData.status = input.status;

  const result = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, id))
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to update project");
  }

  return toProjectRow(row);
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();

  await db.delete(projects).where(eq(projects.id, id));
}

// Helper to convert Drizzle row to legacy ProjectRow format
function toProjectRow(row: typeof projects.$inferSelect): ProjectRow {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    plot: row.plot,
    status: row.status,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
