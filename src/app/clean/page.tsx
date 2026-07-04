"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, CheckSquare, Trash2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PageAnalysis {
  pageNumber: number;
  thumbnailUrl: string;
  isBlank: boolean;
  duplicateOf: number | null; // page number of which this is a duplicate
  hash: string;
}

export default function CleanPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageAnalysis[]>([]);
  const [selectedPages, setSelectedPages] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("cleaned.pdf");

  const { toast } = useToast();

  // Compute 8x8 average hash of canvas pixels
  const getAverageHash = (ctx: CanvasRenderingContext2D): string => {
    const imgData = ctx.getImageData(0, 0, 8, 8);
    const data = imgData.data;
    
    // Convert to grayscale
    const gray: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      gray.push(g);
      sum += g;
    }
    const mean = sum / 64;
    
    // Build hash bits
    let hash = "";
    for (let i = 0; i < 64; i++) {
      hash += gray[i] >= mean ? "1" : "0";
    }
    return hash;
  };

  const getHammingDistance = (h1: string, h2: string): number => {
    let distance = 0;
    for (let i = 0; i < 64; i++) {
      if (h1[i] !== h2[i]) distance++;
    }
    return distance;
  };

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
      setIsLoading(true);
      setPages([]);
      setSelectedPages({});
      setProgress(5);
      setFilename(`cleaned-${uploadedFile.name}`);

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        const analyzedPages: PageAnalysis[] = [];

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          setProgress(Math.round((pageNum / pageCount) * 90));
          
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.25 }); // Low scale for analysis and thumbnails
          
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Could not create canvas 2D context");
          }

          await page.render({ canvasContext: ctx, viewport }).promise;

          // 1. Detect if page is blank (variance checker)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imgData.data;
          let sum = 0;
          let sumSq = 0;
          const pixelCount = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            const v = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            sum += v;
            sumSq += v * v;
          }
          const mean = sum / pixelCount;
          const variance = (sumSq / pixelCount) - (mean * mean);
          const isBlank = variance < 25 && mean > 240;

          // 2. Compute 8x8 average hash for duplicate checking
          const hashCanvas = document.createElement("canvas");
          hashCanvas.width = 8;
          hashCanvas.height = 8;
          const hashCtx = hashCanvas.getContext("2d");
          let hash = "";
          if (hashCtx) {
            hashCtx.drawImage(canvas, 0, 0, 8, 8);
            hash = getAverageHash(hashCtx);
          }
          hashCanvas.width = hashCanvas.height = 0;

          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);

          // 3. Find if this matches any previously processed page
          let duplicateOf: number | null = null;
          for (const prev of analyzedPages) {
            if (prev.hash && hash) {
              const distance = getHammingDistance(prev.hash, hash);
              if (distance <= 4) { // Highly similar
                duplicateOf = prev.pageNumber;
                break;
              }
            }
          }

          analyzedPages.push({
            pageNumber: pageNum,
            thumbnailUrl,
            isBlank,
            duplicateOf,
            hash,
          });

          // Free canvas memory
          canvas.width = canvas.height = 0;
        }

        setPages(analyzedPages);
        setProgress(100);

        const blanksCount = analyzedPages.filter((p) => p.isBlank).length;
        const duplicatesCount = analyzedPages.filter((p) => p.duplicateOf !== null).length;

        if (blanksCount > 0 || duplicatesCount > 0) {
          toast({
            title: "Analysis Complete",
            description: `Found ${blanksCount} blank pages and ${duplicatesCount} duplicate pages.`,
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "No blank or duplicate pages detected.",
          });
        }
      } catch (error) {
        console.error("Error analyzing PDF:", error);
        toast({
          title: "Analysis Error",
          description: "Could not analyze the pages of this PDF.",
          variant: "destructive",
        });
        setFile(null);
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

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) => ({
      ...prev,
      [pageNum]: !prev[pageNum],
    }));
  };

  const selectAllBlanks = () => {
    const next: Record<number, boolean> = { ...selectedPages };
    pages.forEach((p) => {
      if (p.isBlank) {
        next[p.pageNumber] = true;
      }
    });
    setSelectedPages(next);
  };

  const selectAllDuplicates = () => {
    const next: Record<number, boolean> = { ...selectedPages };
    pages.forEach((p) => {
      if (p.duplicateOf !== null) {
        next[p.pageNumber] = true;
      }
    });
    setSelectedPages(next);
  };

  const clearSelection = () => {
    setSelectedPages({});
  };

  const handleCleanPDF = async () => {
    if (!file || pages.length === 0) return;

    const toDelete = Object.keys(selectedPages)
      .map(Number)
      .filter((k) => selectedPages[k]);

    if (toDelete.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select pages to remove.",
        variant: "destructive",
      });
      return;
    }

    if (toDelete.length === pages.length) {
      toast({
        title: "Cannot delete all pages",
        description: "A PDF document must contain at least one page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Delete pages (adjusting indices since indices shift down after deletion)
      // Sort page numbers descending to delete from back to front safely
      const sortedToDelete = [...toDelete].sort((a, b) => b - a);
      sortedToDelete.forEach((pNum) => {
        pdfDoc.removePage(pNum - 1);
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);

      // Chain output
      setSharedFile(new File([blob], filename, { type: "application/pdf" }));

      toast({ title: "Cleaned PDF Downloaded", description: `Removed ${toDelete.length} pages.` });

      // Refresh page list
      const remainingPages = pages
        .filter((p) => !selectedPages[p.pageNumber])
        .map((p, idx) => ({
          ...p,
          pageNumber: idx + 1, // Reset numbering
        }));
      setPages(remainingPages);
      setSelectedPages({});
    } catch (error) {
      console.error("Clean PDF error:", error);
      toast({
        title: "Action Failed",
        description: "Could not remove pages from PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPages([]);
    setSelectedPages({});
    setIsLoading(false);
    setIsProcessing(false);
  };

  const selectedCount = Object.values(selectedPages).filter(Boolean).length;

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm border-b pb-2">Analysis Filters</h3>
        <Button variant="outline" size="sm" onClick={selectAllBlanks} className="w-full text-xs cursor-pointer">
          Select All Blanks
        </Button>
        <Button variant="outline" size="sm" onClick={selectAllDuplicates} className="w-full text-xs cursor-pointer">
          Select All Duplicates
        </Button>
        {selectedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection} className="w-full text-xs text-muted-foreground cursor-pointer">
            Clear Selection
          </Button>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button
        onClick={handleCleanPDF}
        disabled={isProcessing || selectedCount === 0}
        variant="destructive"
        className="w-full cursor-pointer"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        Delete Selected ({selectedCount})
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Clean PDF Pages"
          description="Scan and identify blank or duplicate pages in your PDF documents. Select candidates for quick removal to optimize file size and presentation."
          optionsPanel={pages.length > 0 ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload PDF to scan for blank or duplicate pages"
          >
            {file && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearAll} className="cursor-pointer">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {pages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {pages.map((p) => {
                      const isSelected = !!selectedPages[p.pageNumber];
                      return (
                        <Card
                          key={p.pageNumber}
                          onClick={() => togglePageSelection(p.pageNumber)}
                          className={`relative overflow-hidden cursor-pointer bg-card border hover:border-primary/50 transition-all duration-300 ${
                            isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                          }`}
                        >
                          <CardContent className="p-3 flex flex-col items-center">
                            {/* Selection Checkbox */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <Checkbox checked={isSelected} className="rounded" />
                            </div>

                            {/* Badges */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                              {p.isBlank && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                                  Blank
                                </Badge>
                              )}
                              {p.duplicateOf !== null && (
                                <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600">
                                  Dup of {p.duplicateOf}
                                </Badge>
                              )}
                            </div>

                            <div className="relative aspect-[3/4] w-full bg-muted rounded border overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.thumbnailUrl}
                                alt={`Page ${p.pageNumber}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>

                            <p className="mt-2 text-xs font-semibold text-center text-muted-foreground">
                              Page {p.pageNumber}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
