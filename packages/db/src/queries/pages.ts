import { eq, and, asc, max } from "drizzle-orm";
import { getDb } from "../drizzle";
import { pages } from "../schema";
import type {
  PageRow,
  CreatePageInput,
  UpdatePageInput,
  PageOrder,
} from "../types";

export async function createPage(input: CreatePageInput): Promise<PageRow> {
  const db = getDb();

  const result = await db
    .insert(pages)
    .values({
      projectId: input.project_id,
      pageNumber: input.page_number,
      layoutData: input.layout_data ?? [],
      imageUrl: input.image_url ?? null,
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to create page");
  }

  return toPageRow(row);
}

export async function getPage(id: string): Promise<PageRow | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);

  const row = result[0];
  return row ? toPageRow(row) : null;
}

export async function getProjectPages(projectId: string): Promise<PageRow[]> {
  const db = getDb();

  const result = await db
    .select()
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .orderBy(asc(pages.pageNumber));

  return result.map(toPageRow);
}

export async function updatePage(
  id: string,
  input: UpdatePageInput
): Promise<PageRow> {
  const db = getDb();

  const updateData: Partial<typeof pages.$inferInsert> = {};
  if (input.page_number !== undefined) updateData.pageNumber = input.page_number;
  if (input.layout_data !== undefined) updateData.layoutData = input.layout_data;
  if (input.image_url !== undefined) updateData.imageUrl = input.image_url;

  const result = await db
    .update(pages)
    .set(updateData)
    .where(eq(pages.id, id))
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error("Failed to update page");
  }

  return toPageRow(row);
}

export async function updatePageOrder(
  projectId: string,
  orders: PageOrder[]
): Promise<void> {
  const db = getDb();

  // Use transaction to avoid unique constraint violations during reordering
  await db.transaction(async (tx) => {
    // Phase 1: Set all pages to temporary negative values to avoid conflicts
    await Promise.all(
      orders.map(({ id }, index) =>
        tx
          .update(pages)
          .set({ pageNumber: -(index + 1) })
          .where(and(eq(pages.id, id), eq(pages.projectId, projectId)))
      )
    );

    // Phase 2: Update to final page numbers
    await Promise.all(
      orders.map(({ id, page_number }) =>
        tx
          .update(pages)
          .set({ pageNumber: page_number })
          .where(and(eq(pages.id, id), eq(pages.projectId, projectId)))
      )
    );
  });
}

export async function deletePage(id: string): Promise<void> {
  const db = getDb();

  await db.delete(pages).where(eq(pages.id, id));
}

export async function getNextPageNumber(projectId: string): Promise<number> {
  const db = getDb();

  const result = await db
    .select({ maxPageNumber: max(pages.pageNumber) })
    .from(pages)
    .where(eq(pages.projectId, projectId));

  const maxPageNumber = result[0]?.maxPageNumber ?? 0;
  return maxPageNumber + 1;
}

// Helper to convert Drizzle row to legacy PageRow format
function toPageRow(row: typeof pages.$inferSelect): PageRow {
  return {
    id: row.id,
    project_id: row.projectId,
    page_number: row.pageNumber,
    layout_data: row.layoutData,
    image_url: row.imageUrl,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
