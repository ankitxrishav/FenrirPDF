"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument, rgb, BlendMode } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ThumbnailGrid, GridItem } from "@/components/ThumbnailGrid";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, CheckSquare, Square } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PageState {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  originalIndex: number;
}

export default function InvertPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [pagesToInvert, setPagesToInvert] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

      setPdfFile(uploadedFile);
      setIsLoading(true);
      setProgress(0);
      setPagesToInvert(new Set());

      if (uploadedFile.size > 30 * 1024 * 1024) {
        toast({
          title: "Large file detected",
          description: "Processing may take longer and use significant memory on this device.",
        });
      }

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPages: PageState[] = [];
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
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
            canvas.width = canvas.height = 0; // free memory
          }
          setProgress(Math.round((i / numPages) * 100));
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

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFileChange(sharedFile);
      clearSharedFile();
    }
  }, [sharedFile, handleFileChange, clearSharedFile]);

  const toggleSelectAll = () => {
    if (pagesToInvert.size === pages.length) {
      setPagesToInvert(new Set());
    } else {
      setPagesToInvert(new Set(pages.map((p) => p.id)));
    }
  };

  const handleDownload = async () => {
    if (!pdfFile) {
      toast({
        title: "No file to process",
        description: "Please upload a PDF.",
        variant: "destructive",
      });
      return;
    }

    if (pagesToInvert.size === 0) {
      toast({
        title: "No pages selected",
        description: "Please click on pages to mark them for color inversion.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pdfPages = pdfDoc.getPages();

      pages.forEach((pageState) => {
        if (pagesToInvert.has(pageState.id)) {
          const pageIndex = pageState.originalIndex;
          if (pageIndex >= 0 && pageIndex < pdfPages.length) {
            const page = pdfPages[pageIndex];
            const { width, height } = page.getSize();
            page.drawRectangle({
              x: 0,
              y: 0,
              width,
              height,
              color: rgb(1, 1, 1),
              opacity: 1,
              blendMode: BlendMode.Difference,
            });
          }
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFilename = `inverted-${pdfFile.name}`;
      saveAs(blob, finalFilename);

      // Chain result
      setSharedFile(new File([blob], finalFilename, { type: "application/pdf" }));

      toast({ title: "Success", description: "Your PDF has been inverted and saved." });
    } catch (error) {
      console.error("Error inverting PDF pages:", error);
      toast({
        title: "Error",
        description: "Could not process the PDF for inversion.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = (showToast = true) => {
    setPdfFile(null);
    setPages([]);
    setPagesToInvert(new Set());
    setIsProcessing(false);
    setIsLoading(false);
    if (showToast) {
      toast({ title: "Cleared", description: "The file has been removed." });
    }
  };

  const gridItems: GridItem[] = pages.map((p) => ({
    id: p.id,
    title: `Page ${p.pageNumber}`,
    thumbnailUrl: p.thumbnailUrl,
    pageNumber: p.pageNumber,
    subtitle: `Page ${p.pageNumber}`,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Actions</Label>
        <Button variant="outline" size="sm" onClick={toggleSelectAll} className="w-full flex items-center gap-1.5 justify-center cursor-pointer">
          {pagesToInvert.size === pages.length ? (
            <>
              <Square className="w-4 h-4" />
              Deselect All Pages
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4" />
              Select All Pages
            </>
          )}
        </Button>
      </div>

      <Button onClick={handleDownload} disabled={isProcessing || pagesToInvert.size === 0} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Invert & Download
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Invert PDF Colors"
          description="Selectively invert the colors of specific pages in your PDF. Ideal for printing dark-mode PDFs or night reading."
          optionsPanel={pdfFile ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={pdfFile ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload a single PDF to selectively invert its colors"
          >
            {pdfFile && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pagesToInvert.size} of {pages.length} pages selected for inversion
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => clearAll(true)} className="cursor-pointer">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Color inversion uses PDF blend modes. Results are best in Chrome and Adobe Acrobat. Some mobile viewers may not render inversion correctly.
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Click on the checkbox or pages below to select which ones to invert.
                </p>

                <ThumbnailGrid
                  items={gridItems}
                  onItemsOrderChange={() => {}} // Disabled reordering in Invert tool
                  selectionMode={true}
                  selectedIds={pagesToInvert}
                  onSelectItem={(id) => {
                    setPagesToInvert((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                  extraOverlay={(item) => {
                    const isInverted = pagesToInvert.has(item.id);
                    return isInverted ? (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                          INVERTED
                        </span>
                      </div>
                    ) : null;
                  }}
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
