import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { workflowRoute } from "@mastra/ai-sdk";
import { LangfuseExporter } from "@mastra/langfuse";
import { PinoLogger } from "@mastra/loggers";
import { SamplingStrategyType } from "@mastra/core/ai-tracing";

import {
  storyAnalyzerAgent,
  panelLayoutAgent,
  imageGeneratorAgent,
  textPlacementAgent,
} from "./agents";
import { mangaGenerationWorkflow } from "./workflows";
import { apiRoutes } from "./routes";

const exporter = new LangfuseExporter({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL || "https://cloud.langfuse.com",
  realtime: process.env.NODE_ENV === "development",
  options: {
    environment: process.env.ENVIRONMENT || "development",
  },
});

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
  logger: new PinoLogger({
    name: "Mastra",
    level: process.env.NODE_ENV === "production" ? "info" : "info",
  }),
  observability: {
    configs: {
      development: {
        serviceName: "kimigatari-comics-development",
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [exporter],
      },
      production: {
        serviceName: "kimigatari-comics-production",
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [exporter],
      },
    },
    configSelector: () => process.env.NODE_ENV || "development",
  },
  server: {
    port: 4111,
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      ...apiRoutes,
      workflowRoute({
        path: "/workflow/:workflowId",
      }),
    ],
  },
});
