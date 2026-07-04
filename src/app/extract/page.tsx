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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { useUndoStack } from "@/hooks/useUndoStack";
import { parsePageRange } from "@/lib/rangeParser";
import { Download, Loader2, X, PlusCircle, FileText, Undo, CheckSquare, Square } from "lucide-react";

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

export default function ExtractPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [filename, setFilename] = useState("extracted.pdf");
  const [progress, setProgress] = useState(0);
  const [rangeText, setRangeText] = useState("");

  const { toast } = useToast();
  const { pushState, popState, canUndo, clearHistory } = useUndoStack<PageState[]>();

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
      setFilename(`edited-${uploadedFile.name}`);
      setIsLoading(true);
      setProgress(0);
      setSelectedPages(new Set());
      clearHistory();

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
    [toast, clearHistory]
  );

  // Tool chaining injection
  useEffect(() => {
    if (sharedFile) {
      handleFileChange(sharedFile);
      clearSharedFile();
    }
  }, [sharedFile, handleFileChange, clearSharedFile]);

  const handleItemsOrderChange = (reorderedItems: any[]) => {
    pushState(pages);
    setPages(reorderedItems);
  };

  const handleItemDelete = (id: string) => {
    pushState(pages);
    setPages((prev) => prev.filter((p) => p.id !== id));
    setSelectedPages((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleItemRotate = (id: string) => {
    pushState(pages);
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleUndo = () => {
    const previous = popState();
    if (previous) {
      setPages(previous);
      toast({ title: "Undo", description: "Reverted last change." });
    }
  };

  const handleApplyRange = () => {
    const parsed = parsePageRange(rangeText, pages.length);
    if (parsed.length === 0) {
      toast({ title: "No pages matched", description: "Please verify range input syntax (e.g. 1-3, 5)." });
      return;
    }
    const newSelected = new Set<string>();
    parsed.forEach((pageNum) => {
      const match = pages.find((p) => p.pageNumber === pageNum);
      if (match) newSelected.add(match.id);
    });
    setSelectedPages(newSelected);
    setSelectionMode(true);
    toast({ title: "Range applied", description: `Selected ${newSelected.size} matching pages.` });
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(pages.map((p) => p.id)));
    setSelectionMode(true);
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleDownload = async () => {
    if (!file) return;

    let pagesToInclude = pages;
    if (selectionMode && selectedPages.size > 0) {
      pagesToInclude = pages.filter((p) => selectedPages.has(p.id));
    }

    if (pagesToInclude.length === 0) {
      toast({ title: "No pages to download", description: "Please select or reorder pages.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdf = await PDFDocument.create();

      const pageIndices = pagesToInclude.map((p) => p.originalIndex);
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

      copiedPages.forEach((page, index) => {
        const rotationVal = pagesToInclude[index].rotation;
        if (rotationVal !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationVal));
        }
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFile = new File([blob], filename, { type: "application/pdf" });

      saveAs(blob, filename);
      setSharedFile(finalFile);

      toast({ title: "Success", description: "Your PDF has been exported successfully." });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({ title: "Error", description: "Could not export PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = (showToast = true) => {
    setFile(null);
    setPages([]);
    setSelectedPages(new Set());
    setIsLoading(false);
    setIsProcessing(false);
    setSelectionMode(false);
    setRangeText("");
    clearHistory();
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
    subtitle: `Page ${p.pageNumber}`,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center space-x-2">
          <Switch id="selection-mode" checked={selectionMode} onCheckedChange={setSelectionMode} />
          <Label htmlFor="selection-mode" className="text-sm font-semibold cursor-pointer">Selection Mode</Label>
        </div>
        {canUndo && (
          <Button variant="ghost" size="sm" onClick={handleUndo} className="h-8 text-xs cursor-pointer">
            <Undo className="w-3.5 h-3.5 mr-1" />
            Undo
          </Button>
        )}
      </div>

      {selectionMode && (
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="range-input" className="text-xs text-muted-foreground">Select by Page Range</Label>
            <div className="flex gap-2">
              <Input
                id="range-input"
                placeholder="e.g. 1-3, 5, 8-10"
                value={rangeText}
                onChange={(e) => setRangeText(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={handleApplyRange} className="h-9 text-xs shrink-0 cursor-pointer">
                Select
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs cursor-pointer">
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearSelection} className="text-xs cursor-pointer">
              <Square className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          </div>
        </div>
      )}

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
        {selectionMode && selectedPages.size > 0
          ? `Export Selected (${selectedPages.size})`
          : "Export PDF"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <ToolShell
            title="Extract & Reorder PDF Pages"
            description="Drag to reorder pages. Enable selection mode to delete, rotate, or extract specific page ranges instantly."
            optionsPanel={file ? optionsPanel : undefined}
          >
            <UploadShell
              filesCount={file ? 1 : 0}
              isLoading={isLoading}
              progress={progress}
              onFilesChange={(files) => handleFileChange(files[0])}
              description="Upload a single PDF to extract and reorder pages"
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
                    onItemsOrderChange={handleItemsOrderChange}
                    onItemDelete={handleItemDelete}
                    onItemRotate={handleItemRotate}
                    selectionMode={selectionMode}
                    selectedIds={selectedPages}
                    onSelectItem={(id) => {
                      setSelectedPages((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    }}
                  />

                  {/* Chaining bar */}
                  <ToolChainingBar />
                </div>
              )}
            </UploadShell>
          </ToolShell>
        </div>
      </main>
    </div>
  );
}
