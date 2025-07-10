"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Loader2,
  GripVertical,
  X,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PdfFile {
  id: string;
  file: File;
}

const SortableFileItem: React.FC<{
  item: PdfFile;
  onDelete: (id: string) => void;
}> = ({ item, onDelete }) => {
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

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`flex items-center p-3 gap-3 transition-shadow ${
          isDragging ? "shadow-2xl" : "shadow-sm"
        }`}
      >
        <button {...attributes} {...listeners} className="cursor-grab p-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        <FileText className="w-6 h-6 text-primary flex-shrink-0" />
        <span className="flex-grow truncate font-medium">{item.file.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-5 h-5 text-destructive" />
        </Button>
      </Card>
    </div>
  );
};

export default function MergePage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [filename, setFilename] = useState("merged.pdf");
  const { toast } = useToast();

  const handleFilesChange = useCallback(
    (uploadedFiles: FileList | null) => {
      if (!uploadedFiles) return;

      const pdfFiles = Array.from(uploadedFiles).filter(
        (file) => file.type === "application/pdf"
      );

      if (pdfFiles.length !== uploadedFiles.length) {
        toast({
          title: "Some files were not PDFs",
          description: "Only PDF files can be merged.",
          variant: "destructive",
        });
      }

      const newPdfFiles = pdfFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
      }));

      setFiles((prev) => [...prev, ...newPdfFiles]);
    },
    [toast]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFilesChange(acceptedFiles as any as FileList); // a bit of a hack
    },
    [handleFilesChange]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const addMoreFiles = () => {
    document.getElementById('file-upload-input')?.click();
  }

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please upload at least two PDFs to merge.",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const { file } of files) {
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      toast({
        title: "Merge Error",
        description: "An error occurred while merging the PDFs.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };
  
  const clearAll = () => {
    setFiles([]);
    setIsMerging(false);
  };

  const fileIds = useMemo(() => files.map((f) => f.id), [files]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {files.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center h-[60vh] cursor-pointer"
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag &amp; Drop or Click to Upload
            </h2>
            <p className="mt-2 text-muted-foreground">
              Select multiple PDF files to merge
            </p>
            <Input
              id="file-upload-input"
              type="file"
              className="hidden"
              multiple
              accept="application/pdf"
              onChange={(e) => handleFilesChange(e.target.files)}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                <h2 className="text-xl font-semibold">Your Files</h2>
                <div className="flex items-center gap-4">
                  <Button onClick={handleMerge} disabled={isMerging}>
                    {isMerging ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Merge PDFs
                  </Button>
                  <Button variant="outline" onClick={addMoreFiles}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add More
                    <Input
                      id="file-upload-input"
                      type="file"
                      className="hidden"
                      multiple
                      accept="application/pdf"
                      onChange={(e) => handleFilesChange(e.target.files)}
                    />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">Drag and drop files to reorder them.</p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fileIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {files.map((file) => (
                    <SortableFileItem
                      key={file.id}
                      item={file}
                      onDelete={deleteFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-md">
                <Label htmlFor="filename">Output Filename</Label>
                <Input id="filename" value={filename} onChange={e => setFilename(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
