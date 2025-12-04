"use server";

import { updateProject } from "@kimigatari/db";

export async function updateProjectTitle(
  projectId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateProject(projectId, { title });
    return { success: true };
  } catch (error) {
    console.error("Error updating project title:", error);
    return { success: false, error: "Failed to update title" };
  }
}
