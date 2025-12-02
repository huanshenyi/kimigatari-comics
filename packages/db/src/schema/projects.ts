import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const projectStatusValues = [
  "draft",
  "generating",
  "completed",
  "error",
] as const;

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  plot: text("plot").notNull().default(""),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("draft")
    .$type<(typeof projectStatusValues)[number]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
