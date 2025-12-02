import { relations } from "drizzle-orm";

// Export all tables
export { projects, projectStatusValues } from "./projects";
export { pages } from "./pages";
export { assets, assetTypeValues } from "./assets";
export { projectAssets, assetRoleValues } from "./project-assets";

// Import for relations
import { projects } from "./projects";
import { pages } from "./pages";
import { assets } from "./assets";
import { projectAssets } from "./project-assets";

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  pages: many(pages),
  projectAssets: many(projectAssets),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  project: one(projects, {
    fields: [pages.projectId],
    references: [projects.id],
  }),
}));

export const assetsRelations = relations(assets, ({ many }) => ({
  projectAssets: many(projectAssets),
}));

export const projectAssetsRelations = relations(projectAssets, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssets.projectId],
    references: [projects.id],
  }),
  asset: one(assets, {
    fields: [projectAssets.assetId],
    references: [assets.id],
  }),
}));
