
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
import { useDropzone } from "react-dropzone";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  Trash2,
  Download,
  Loader2,
  X,
  PlusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface Page {
  id: string;
  pdfSourceId: string;
  originalIndex: number;
  thumbnailUrl: string;
  sourceFilename: string;
}

interface SortablePageThumbnailProps {
  page: Page;
  onDelete: (id: string) => void;
  index: number;
}

const SortablePageThumbnail: React.FC<SortablePageThumbnailProps> = ({ page, onDelete, index }) => {
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
        }`}
      >
        <CardContent
          className="p-0 aspect-[3/4] flex items-center justify-center bg-muted"
          {...listeners}
        >
          <img
            src={page.thumbnailUrl}
            alt={`Page from ${page.sourceFilename}`}
            className="w-full h-full object-contain"
          />
        </CardContent>
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
          {index + 1}
        </div>
         <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-sm truncate max-w-[calc(100%-40px)]">
          {page.sourceFilename}
        </div>
      </Card>
    </div>
  );
};

export default function MergePage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [sourcePdfs, setSourcePdfs] = useState<Map<string, {file: File, doc: PDFDocument}>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("merged.pdf");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (uploadedFiles: File[]) => {
      if (!uploadedFiles || uploadedFiles.length === 0) return;
      setIsLoading(true);
      setProgress(0);
      
      const newPages: Page[] = [];
      const newSourcePdfs = new Map(sourcePdfs);

      try {
        let processedPages = 0;
        let totalPages = 0;
        const pdfjsDocs = [];

        // First pass: get total number of pages for progress calculation
        for (const file of uploadedFiles) {
            if (file.type !== "application/pdf") continue;
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
            totalPages += pdfjsDoc.numPages;
            pdfjsDocs.push({file, pdfjsDoc});
        }
        
        for (const { file, pdfjsDoc } of pdfjsDocs) {
          const pdfSourceId = `${file.name}-${file.lastModified}-${file.size}`;
          if (!newSourcePdfs.has(pdfSourceId)) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            newSourcePdfs.set(pdfSourceId, {file, doc: pdfDoc});
          }

          for (let i = 1; i <= pdfjsDoc.numPages; i++) {
            const page = await pdfjsDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 }); // Reduced scale for performance
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              newPages.push({
                id: `${pdfSourceId}-page-${i}-${Math.random()}`,
                pdfSourceId,
                originalIndex: i - 1,
                thumbnailUrl: canvas.toDataURL(),
                sourceFilename: file.name
              });
            }
            processedPages++;
            setProgress(Math.round((processedPages / totalPages) * 100));
          }
        }
        
        setPages(p => [...p, ...newPages]);
        setSourcePdfs(newSourcePdfs);

      } catch (error) {
        console.error("Error processing PDFs:", error);
        toast({ title: "Error processing PDF", description: "Could not read one or more PDF files.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, sourcePdfs]
  );
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, [handleFilesChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
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

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMerge = async () => {
    if (pages.length === 0) {
      toast({ title: "No pages to merge", description: "Please upload some PDFs.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();

      for (const page of pages) {
        const sourcePdfData = sourcePdfs.get(page.pdfSourceId);
        if (sourcePdfData) {
          // Re-load the document to avoid context issues if it was modified
          const reloadedDoc = await PDFDocument.load(await sourcePdfData.file.arrayBuffer());
          const [copiedPage] = await newPdf.copyPages(reloadedDoc, [page.originalIndex]);
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
      console.error("Error creating merged PDF:", error);
      toast({ title: "Merge Error", description: "Could not create the merged PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setPages([]);
    setSourcePdfs(new Map());
    setIsProcessing(false);
    setIsLoading(false);
    setProgress(0);
  };
  
  const pageIds = useMemo(() => pages.map((p) => p.id), [pages]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Merge PDF Files Online</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
                Combine multiple PDF files into a single, organized document. Upload your files, drag and drop pages to set the order, and download your merged PDF in seconds.
            </p>
        </div>
        {pages.length === 0 && !isLoading ? (
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
              Select multiple PDF files to merge their pages
            </p>
          </div>
        ) : isLoading && pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-full max-w-md space-y-4">
                <p className="text-lg text-center text-muted-foreground">
                  Processing your PDFs...
                </p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                <h2 className="text-xl font-semibold">Your Pages ({pages.length})</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <Button onClick={handleMerge} disabled={isProcessing || isLoading}>
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Merge & Download
                  </Button>
                  <Button variant="outline" onClick={open} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Another
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">Drag and drop pages to reorder them for the final merged PDF.</p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pageIds}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {pages.map((page, index) => (
                    <SortablePageThumbnail
                      key={page.id}
                      page={page}
                      onDelete={deletePage}
                      index={index}
                    />
                  ))}
                   {isLoading && (
                      <div className="flex flex-col items-center justify-center aspect-[3/4] p-4 border border-dashed rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <p className="mt-2 text-sm text-center text-muted-foreground">Loading...</p>
                      </div>
                    )}
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
