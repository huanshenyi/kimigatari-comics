import { registerApiRoute } from "@mastra/core/server";
import type { Context } from "hono";
import {
  createProjectRequestSchema,
} from "@kimigatari/types";

// In-memory storage for demo purposes
// In production, use Supabase or another database
const projects = new Map<
  string,
  {
    id: string;
    title: string;
    plot: string;
    status: "draft" | "generating" | "completed" | "error";
    createdAt: Date;
    updatedAt: Date;
    runId?: string;
    pages?: unknown[];
    progress?: number;
    currentStep?: string;
    error?: string;
  }
>();

// Helper to generate UUIDs
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * POST /projects - Create a new project
 */
export const createProjectRoute = registerApiRoute("/projects", {
  method: "POST",
  handler: async (c: Context) => {
    try {
      const body = await c.req.json();
      const parsed = createProjectRequestSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: "Invalid request body", details: parsed.error.errors },
          400
        );
      }

      const { title, plot } = parsed.data;
      const id = generateId();
      const now = new Date();

      const project = {
        id,
        title,
        plot,
        status: "draft" as const,
        createdAt: now,
        updatedAt: now,
      };

      projects.set(id, project);

      return c.json({
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Error creating project:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * GET /projects - List all projects
 */
export const listProjectsRoute = registerApiRoute("/projects/list", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const projectList = Array.from(projects.values()).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));

      return c.json({ projects: projectList });
    } catch (error) {
      console.error("Error listing projects:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * GET /projects/:id - Get a specific project
 */
export const getProjectRoute = registerApiRoute("/projects/:id", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const project = projects.get(id);

      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json({
        id: project.id,
        title: project.title,
        plot: project.plot,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        pages: project.pages,
      });
    } catch (error) {
      console.error("Error getting project:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * POST /projects/:id/generate - Start manga generation
 */
export const generateMangaRoute = registerApiRoute(
  "/projects/:id/generate",
  {
    method: "POST",
    handler: async (c: Context) => {
      try {
        const id = c.req.param("id");
        const project = projects.get(id);

        if (!project) {
          return c.json({ error: "Project not found" }, 404);
        }

        if (project.status === "generating") {
          return c.json({ error: "Generation already in progress" }, 409);
        }

        const body = await c.req.json().catch(() => ({}));
        const targetPageCount = (body as { pageCount?: number }).pageCount || 4;

        // Get the Mastra instance from context
        const mastra = c.get("mastra");
        const workflow = mastra.getWorkflow("mangaGeneration");

        // Update project status
        project.status = "generating";
        project.progress = 0;
        project.currentStep = "initializing";
        project.updatedAt = new Date();
        projects.set(id, project);

        // Start the workflow asynchronously
        const run = workflow.createRun();

        // Store the run ID
        project.runId = run.runId;
        projects.set(id, project);

        // Execute workflow in background
        run
          .start({
            inputData: {
              plot: project.plot,
              title: project.title,
              targetPageCount,
            },
          })
          .then((result: { status: string; result?: { pages?: unknown[] }; error?: { message?: string } }) => {
            const existingProject = projects.get(id);
            if (existingProject) {
              if (result.status === "success") {
                existingProject.status = "completed";
                existingProject.pages = result.result?.pages || [];
              } else {
                existingProject.status = "error";
                existingProject.error =
                  result.error?.message || "Unknown error";
              }
              existingProject.updatedAt = new Date();
              projects.set(id, existingProject);
            }
          })
          .catch((error: Error) => {
            const existingProject = projects.get(id);
            if (existingProject) {
              existingProject.status = "error";
              existingProject.error = error.message;
              existingProject.updatedAt = new Date();
              projects.set(id, existingProject);
            }
          });

        return c.json({
          message: "Generation started",
          projectId: id,
          runId: run.runId,
        });
      } catch (error) {
        console.error("Error starting generation:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  }
);

/**
 * GET /projects/:id/status - Get generation status
 */
export const getStatusRoute = registerApiRoute("/projects/:id/status", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const project = projects.get(id);

      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json({
        projectId: project.id,
        status: project.status,
        progress: project.progress || 0,
        currentStep: project.currentStep,
        error: project.error,
        runId: project.runId,
      });
    } catch (error) {
      console.error("Error getting status:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

/**
 * GET /projects/:id/pages - Get generated pages
 */
export const getPagesRoute = registerApiRoute("/projects/:id/pages", {
  method: "GET",
  handler: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const project = projects.get(id);

      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json({
        projectId: project.id,
        pages: project.pages || [],
        status: project.status,
      });
    } catch (error) {
      console.error("Error getting pages:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
});

// Import asset routes
import { assetRoutes } from "./assets";

// Export all routes as an array for easy registration
export const apiRoutes = [
  createProjectRoute,
  listProjectsRoute,
  getProjectRoute,
  generateMangaRoute,
  getStatusRoute,
  getPagesRoute,
  ...assetRoutes,
];
