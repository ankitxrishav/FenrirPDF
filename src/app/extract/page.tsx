
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { useDropzone } from 'react-dropzone';

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Loader2,
  X,
  PlusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface Page {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  originalIndex: number;
}

interface SortablePageThumbnailProps {
  page: Page;
  isSelected: boolean;
  onSelect: (pageNumber: number) => void;
  onDelete: (pageNumber: number) => void;
  selectionMode: boolean;
}

const SortablePageThumbnail: React.FC<SortablePageThumbnailProps> = ({
  page,
  isSelected,
  onSelect,
  onDelete,
  selectionMode,
}) => {
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`relative group overflow-hidden transition-all duration-300 ${
          isDragging ? "shadow-2xl scale-105" : "shadow-md"
        } ${isSelected ? "ring-2 ring-accent" : ""}`}
      >
        <CardContent
          className="p-0 aspect-[3/4] flex items-center justify-center bg-muted"
          {...listeners}
        >
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain"
          />
        </CardContent>
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(page.pageNumber)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
          {page.pageNumber}
        </div>
        {selectionMode && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(page.pageNumber)}
              className="bg-white"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [filename, setFilename] = useState("extracted.pdf");
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();

  const handleFileChange = useCallback(
    async (uploadedFile: File | null) => {
      if (!uploadedFile) return;
      if (uploadedFile.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }
      // Reset state for new file
      clearAll();
      setFile(uploadedFile);
      setFilename(`edited-${uploadedFile.name}`);
      setIsLoading(true);
      setProgress(0);
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPages: Page[] = [];
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 }); // Reduced scale for performance
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            newPages.push({
              id: `page-${i}`,
              pageNumber: i,
              thumbnailUrl: canvas.toDataURL(),
              originalIndex: i - 1,
            });
          }
          setProgress(Math.round((i / totalPages) * 100));
        }
        setPages(newPages);
      } catch (error) {
        console.error("Error processing PDF:", error);
        toast({
          title: "Error processing PDF",
          description: "Could not read the PDF file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  }, [handleFileChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const deletePage = (pageNumberToDelete: number) => {
    setPages((prev) => prev.filter((p) => p.pageNumber !== pageNumberToDelete));
  };

  const handleDownload = async () => {
    if (!file) return;

    let pagesToInclude: Page[];
    if (selectionMode && selectedPages.size > 0) {
      const selectedPageNumbers = Array.from(selectedPages);
      pagesToInclude = pages.filter((p) => selectedPageNumbers.includes(p.pageNumber));
    } else {
      pagesToInclude = pages;
    }

    if (pagesToInclude.length === 0) {
      toast({ title: "No pages to download", description: "Please select pages or reorder.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdf = await PDFDocument.create();

      const pageIndices = pagesToInclude.map((p) => p.originalIndex);
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
        console.error("Error creating PDF:", error);
        toast({ title: "Error", description: "Could not create the new PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setFile(null);
    setPages([]);
    setSelectedPages(new Set());
    setIsLoading(false);
    setIsProcessing(false);
    setSelectionMode(false);
  }

  const pageIds = useMemo(() => pages.map((p) => p.id), [pages]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Extract & Reorder PDF Pages</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Easily extract specific pages from your PDF. Drag and drop to reorder, delete unwanted pages, and download your newly organized file instantly.
            </p>
        </div>
        {!file ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag &amp; Drop or <span className="text-accent underline" onClick={open}>Click to Upload</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload a single PDF to get started
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-full max-w-md space-y-4">
                <p className="text-lg text-center text-muted-foreground">
                  Processing your PDF...
                </p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-primary"/>
                  <span className="font-semibold">{file.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="selection-mode">Selection Mode</Label>
                    <Switch id="selection-mode" checked={selectionMode} onCheckedChange={setSelectionMode} />
                  </div>
                  <Button onClick={handleDownload} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {selectionMode && selectedPages.size > 0 ? `Download ${selectedPages.size} Pages` : "Download PDF"}
                  </Button>
                  <Button variant="outline" onClick={open}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Another
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pageIds} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {pages.map((page) => (
                    <SortablePageThumbnail
                      key={page.id}
                      page={page}
                      isSelected={selectedPages.has(page.pageNumber)}
                      onSelect={togglePageSelection}
                      onDelete={deletePage}
                      selectionMode={selectionMode}
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
