import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

import {
  storyAnalyzerAgent,
  panelLayoutAgent,
  imageGeneratorAgent,
  textPlacementAgent,
} from "./agents";
import { mangaGenerationWorkflow } from "./workflows";
import { apiRoutes } from "./routes";

export const mastra = new Mastra({
  agents: {
    storyAnalyzer: storyAnalyzerAgent,
    panelLayout: panelLayoutAgent,
    imageGenerator: imageGeneratorAgent,
    textPlacement: textPlacementAgent,
  },
  workflows: {
    mangaGeneration: mangaGenerationWorkflow,
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || ":memory:",
  }),
  server: {
    port: 4111,
    cors: {
      origin: ["http://localhost:3000"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    },
    apiRoutes,
  },
});
