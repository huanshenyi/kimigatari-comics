import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const assetTypeValues = [
  "character",
  "background",
  "generated",
  "reference",
] as const;

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  type: varchar("type", { length: 20 })
    .notNull()
    .$type<(typeof assetTypeValues)[number]>(),
  name: varchar("name", { length: 200 }).notNull(),
  s3Key: text("s3_key").notNull().unique(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
