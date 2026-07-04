"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
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
import { RotateCw, RotateCcw, RefreshCcw, Download, Loader2, X, PlusCircle, FileText } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PageState {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
}

export default function RotatePage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("rotated.pdf");
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

      setFile(uploadedFile);
      setFilename(`rotated-${uploadedFile.name}`);
      setIsLoading(true);
      setProgress(0);

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
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
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
              rotation: 0,
            });
            canvas.width = canvas.height = 0; // free memory
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

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFileChange(sharedFile);
      clearSharedFile();
    }
  }, [sharedFile, handleFileChange, clearSharedFile]);

  const handleRotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleRotateAll = (amount: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + amount + 360) % 360,
      }))
    );
  };

  const handleResetAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const handleDownload = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdf = await PDFDocument.create();

      const pageIndices = pages.map((p) => p.originalIndex);
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

      copiedPages.forEach((page, index) => {
        const rotationVal = pages[index].rotation;
        if (rotationVal !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationVal));
        }
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFile = new File([blob], filename, { type: "application/pdf" });

      // Save locally
      saveAs(blob, filename);

      // Save in context for chaining
      setSharedFile(finalFile);

      toast({ title: "Success", description: "Your PDF has been rotated and downloaded." });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({ title: "Error", description: "Could not create the new PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = (showToast = true) => {
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setIsProcessing(false);
    if (showToast) {
      toast({ title: "Cleared", description: "All files and settings have been cleared." });
    }
  };

  const gridItems: GridItem[] = pages.map((p) => ({
    id: p.id,
    title: `Page ${p.pageNumber}`,
    thumbnailUrl: p.thumbnailUrl,
    pageNumber: p.pageNumber,
    rotation: p.rotation,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Bulk Rotation</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotateAll(90)}
            className="flex items-center gap-1.5 justify-center cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            +90° All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotateAll(-90)}
            className="flex items-center gap-1.5 justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            -90° All
          </Button>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleResetAll}
        className="w-full flex items-center gap-1.5 justify-center cursor-pointer"
      >
        <RefreshCcw className="w-4 h-4" />
        Reset All Rotations
      </Button>

      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button onClick={handleDownload} disabled={isProcessing} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download Rotated PDF
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Rotate PDF Pages"
          description="Rotate individual pages or all pages of your PDF document. Everything is processed directly in your browser."
          optionsPanel={file ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload a single PDF to rotate its pages"
          >
            {file && (
              <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <span className="font-semibold">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => clearAll(true)} className="text-xs cursor-pointer">
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Grid */}
                <ThumbnailGrid
                  items={gridItems}
                  onItemsOrderChange={() => {}} // Disabled order change in Rotate tool
                  onItemRotate={handleRotatePage}
                />

                {/* Chaining bar */}
                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
