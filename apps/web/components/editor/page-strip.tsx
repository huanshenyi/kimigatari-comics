"use client";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { PageThumbnail } from "./page-thumbnail";
import type { PageRow } from "@kimigatari/db";

interface PageStripProps {
  pages: PageRow[];
  currentIndex: number;
  onPageSelect: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddPage: () => void;
}

export function PageStrip({
  pages,
  currentIndex,
  onPageSelect,
  onDragEnd,
  onAddPage,
}: PageStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="h-28 border-t border-border bg-card/50 px-4 py-3 flex-shrink-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-3 h-full overflow-x-auto">
            {pages.map((page, index) => (
              <PageThumbnail
                key={page.id}
                page={page}
                index={index}
                isActive={index === currentIndex}
                onClick={() => onPageSelect(index)}
              />
            ))}

            {/* Add page button */}
            <button
              onClick={onAddPage}
              className="w-16 h-20 flex-shrink-0 border-2 border-dashed border-border rounded-lg
                         flex flex-col items-center justify-center gap-1
                         hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">追加</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
