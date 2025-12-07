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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageStripProps {
  pages: PageRow[];
  currentIndex: number;
  onPageSelect: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddPage: () => void;
  onDeletePage?: (pageId: string) => void;
}

export function PageStrip({
  pages,
  currentIndex,
  onPageSelect,
  onDragEnd,
  onAddPage,
  onDeletePage,
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
    <TooltipProvider>
      <div className="h-40 border-t border-border bg-card/50 px-3 py-2 flex-shrink-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={pages.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex items-center gap-2 h-full overflow-x-auto">
              {pages.map((page, index) => (
                <PageThumbnail
                  key={page.id}
                  page={page}
                  index={index}
                  isActive={index === currentIndex}
                  onClick={() => onPageSelect(index)}
                  onDelete={onDeletePage}
                />
              ))}

              {/* Add page button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onAddPage}
                    className="w-20 h-28 flex-shrink-0 border border-dashed border-border rounded-lg
                               flex flex-col items-center justify-center gap-1
                               hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      追加
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>ページを追加</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </TooltipProvider>
  );
}
