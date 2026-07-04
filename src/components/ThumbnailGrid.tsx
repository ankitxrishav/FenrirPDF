"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export interface GridItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  pageNumber: number;
  rotation?: number;
  subtitle?: string;
}

interface SortableGridItemProps {
  item: GridItem;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRotate?: (id: string) => void;
  selectionMode: boolean;
  aspectRatioClass?: string;
  extraOverlay?: (item: GridItem) => React.ReactNode;
}

const SortableGridItem: React.FC<SortableGridItemProps> = ({
  item,
  isSelected,
  onSelect,
  onDelete,
  onRotate,
  selectionMode,
  aspectRatioClass = "aspect-[3/4]",
  extraOverlay,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const rotation = item.rotation || 0;
  const scale = rotation === 90 || rotation === 270 ? 0.75 : 1;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`relative group overflow-hidden transition-all duration-300 ${
          isDragging ? "shadow-2xl scale-105" : "shadow-md"
        } ${isSelected ? "ring-2 ring-primary" : ""}`}
      >
        <CardContent
          className={`p-0 ${aspectRatioClass} flex items-center justify-center bg-muted cursor-grab active:cursor-grabbing touch-none`}
          {...listeners}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-contain pointer-events-none"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: "transform 0.2s ease-in-out",
            }}
          />
        </CardContent>

        {/* Buttons Overlay */}
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
          {onRotate && (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/80 hover:bg-background shadow cursor-pointer"
              aria-label={`Rotate page ${item.pageNumber} clockwise`}
              onClick={(e) => {
                e.stopPropagation();
                onRotate(item.id);
              }}
            >
              <RotateCw className="h-4 w-4 text-foreground" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 shadow cursor-pointer"
              aria-label={`Delete page ${item.pageNumber}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Page/Subtitle Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 truncate px-2 pointer-events-none">
          {item.subtitle || item.pageNumber}
        </div>

        {/* Selection Checkbox */}
        {selectionMode && onSelect && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(item.id)}
              className="bg-white shadow cursor-pointer"
              aria-label={`Select page ${item.pageNumber}`}
            />
          </div>
        )}

        {/* Extra Custom Overlay */}
        {extraOverlay && extraOverlay(item)}
      </Card>
    </div>
  );
};

interface ThumbnailGridProps {
  items: GridItem[];
  onItemsOrderChange: (items: GridItem[]) => void;
  onItemDelete?: (id: string) => void;
  onItemRotate?: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectItem?: (id: string) => void;
  aspectRatioClass?: string;
  extraOverlay?: (item: GridItem) => React.ReactNode;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  items,
  onItemsOrderChange,
  onItemDelete,
  onItemRotate,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectItem,
  aspectRatioClass = "aspect-[3/4]",
  extraOverlay,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      onItemsOrderChange(reordered);
    }
  };

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <SortableGridItem
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onSelect={onSelectItem}
              onDelete={onItemDelete}
              onRotate={onItemRotate}
              selectionMode={selectionMode}
              aspectRatioClass={aspectRatioClass}
              extraOverlay={extraOverlay}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
