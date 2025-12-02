import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    layoutData: jsonb("layout_data").notNull().default([]),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.projectId, table.pageNumber)]
);
