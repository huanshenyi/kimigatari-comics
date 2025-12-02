import { notFound } from "next/navigation";
import { getProject, getProjectPages } from "@kimigatari/db";
import { ComicEditor } from "@/components/editor/comic-editor";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const pages = await getProjectPages(id);

  return <ComicEditor project={project} initialPages={pages} />;
}
