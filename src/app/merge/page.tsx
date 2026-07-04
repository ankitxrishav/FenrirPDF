"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ThumbnailGrid, GridItem } from "@/components/ThumbnailGrid";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, PlusCircle, FileText } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PageState {
  id: string;
  pdfSourceId: string;
  originalIndex: number;
  thumbnailUrl: string;
  sourceFilename: string;
  pageNumber: number;
}

export default function MergePage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [pages, setPages] = useState<PageState[]>([]);
  const [sourcePdfs, setSourcePdfs] = useState<Map<string, { file: File; doc: PDFDocument }>>(new Map());
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

      // Warn for large files
      const largeFiles = uploadedFiles.filter((f) => f.size > 30 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "Large file detected",
          description: "Processing may take longer and use significant memory on this device.",
        });
      }

      const newPages: PageState[] = [];
      const newSourcePdfs = new Map(sourcePdfs);

      try {
        let processedPages = 0;
        let totalPages = 0;
        const pdfjsDocs = [];

        // First pass: get total number of pages for progress calculation
        for (const file of uploadedFiles) {
          if (file.type !== "application/pdf") continue;
          const arrayBuffer = await file.arrayBuffer();
          const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          totalPages += pdfjsDoc.numPages;
          pdfjsDocs.push({ file, pdfjsDoc });
        }

        let currentPageNumber = pages.length + 1;
        for (const { file, pdfjsDoc } of pdfjsDocs) {
          const pdfSourceId = `${file.name}-${file.lastModified}-${file.size}`;
          if (!newSourcePdfs.has(pdfSourceId)) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            newSourcePdfs.set(pdfSourceId, { file, doc: pdfDoc });
          }

          for (let i = 1; i <= pdfjsDoc.numPages; i++) {
            const page = await pdfjsDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });
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
                sourceFilename: file.name,
                pageNumber: currentPageNumber++,
              });
              canvas.width = canvas.height = 0; // free memory
            }
            processedPages++;
            setProgress(Math.round((processedPages / totalPages) * 100));
          }
        }

        setPages((p) => [...p, ...newPages]);
        setSourcePdfs(newSourcePdfs);
      } catch (error) {
        console.error("Error processing PDFs:", error);
        toast({
          title: "Error processing PDF",
          description: "Could not read one or more PDF files.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, sourcePdfs, pages.length]
  );

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFilesChange([sharedFile]);
      clearSharedFile();
    }
  }, [sharedFile, handleFilesChange, clearSharedFile]);

  const handleItemsOrderChange = (reorderedItems: any[]) => {
    // Re-index page numbers dynamically
    const updated = reorderedItems.map((item, idx) => ({
      ...item,
      pageNumber: idx + 1,
    }));
    setPages(updated);
  };

  const deletePage = (id: string) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  const handleMerge = async () => {
    if (pages.length === 0) {
      toast({
        title: "No pages to merge",
        description: "Please upload some PDFs.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();

      for (const page of pages) {
        const sourcePdfData = sourcePdfs.get(page.pdfSourceId);
        if (sourcePdfData) {
          const reloadedDoc = await PDFDocument.load(await sourcePdfData.file.arrayBuffer());
          const [copiedPage] = await newPdf.copyPages(reloadedDoc, [page.originalIndex]);
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFile = new File([blob], filename, { type: "application/pdf" });

      saveAs(blob, filename);
      setSharedFile(finalFile);

      toast({ title: "Success", description: "All PDFs have been successfully merged." });
    } catch (error) {
      console.error("Error creating merged PDF:", error);
      toast({
        title: "Merge Error",
        description: "Could not create the merged PDF.",
        variant: "destructive",
      });
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
    toast({ title: "Cleared", description: "All files and settings have been cleared." });
  };

  const gridItems: GridItem[] = pages.map((p) => ({
    id: p.id,
    title: `Page from ${p.sourceFilename}`,
    thumbnailUrl: p.thumbnailUrl,
    pageNumber: p.pageNumber,
    subtitle: `${p.pageNumber} (${p.sourceFilename})`,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button onClick={handleMerge} disabled={isProcessing || isLoading} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Merge & Download
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Merge PDF Files Online"
          description="Combine multiple PDF files into a single, organized document. Upload your files, drag and drop pages to set the order, and download your merged PDF in seconds."
          optionsPanel={pages.length > 0 ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={pages.length}
            isLoading={isLoading && pages.length === 0}
            progress={progress}
            onFilesChange={handleFilesChange}
            multiple={true}
            description="Select multiple PDF files to merge their pages"
          >
            {pages.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <h2 className="text-xl font-semibold">Your Pages ({pages.length})</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("file-uploader-input")?.click()} className="text-xs cursor-pointer">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Upload Another
                    </Button>
                    {/* Hidden input to facilitate trigger */}
                    <input
                      id="file-uploader-input"
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFilesChange(Array.from(e.target.files));
                      }}
                    />
                    <Button variant="ghost" size="icon" aria-label="Clear all files" onClick={clearAll} className="cursor-pointer">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Drag and drop pages to reorder them for the final merged PDF.
                </p>

                <ThumbnailGrid
                  items={gridItems}
                  onItemsOrderChange={handleItemsOrderChange}
                  onItemDelete={deletePage}
                />

                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
