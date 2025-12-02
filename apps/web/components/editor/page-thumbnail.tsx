"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { PageRow } from "@kimigatari/db";

interface PageThumbnailProps {
  page: PageRow;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function PageThumbnail({
  page,
  index,
  isActive,
  onClick,
}: PageThumbnailProps) {
  // Get preview URL from image_url or layout_data
  const layoutData = page.layout_data as Array<{ imageUrl?: string }> | null;
  const previewUrl = page.image_url || layoutData?.[0]?.imageUrl;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer
        border-2 transition-all
        ${
          isActive
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50"
        }
        ${isDragging ? "opacity-50 shadow-lg" : ""}
      `}
      onClick={onClick}
    >
      {/* Thumbnail image or placeholder */}
      <div className="w-full h-full bg-[hsl(var(--washi))]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Page ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            {index + 1}
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 p-0.5 rounded bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-background cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Page number badge */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-medium">
        {index + 1}
      </div>
    </div>
  );
}
