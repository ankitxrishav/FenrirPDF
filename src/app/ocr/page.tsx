"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, SearchCode, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

export default function OcrPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [filename, setFilename] = useState("searchable.pdf");
  const [ocrLanguage, setOcrLanguage] = useState("eng");

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
      setFilename(`searchable-${uploadedFile.name}`);
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

  const handleRunOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusText("Initializing local WASM OCR engine...");

    let worker: any = null;
    try {
      // 1. Initialize Tesseract worker
      worker = await createWorker(ocrLanguage, 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pageProgress = Math.round(m.progress * 100);
            setStatusText(`Recognizing page text... (${pageProgress}%)`);
          }
        },
      });

      // 2. Load PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Load PDFJS doc to render pages to canvas
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfJsDoc = await loadingTask.promise;

      setProgress(15);

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        setStatusText(`Rendering page ${pageNum} of ${pageCount}...`);
        
        // Render PDF page to high-res canvas (2.0x scale for high OCR accuracy)
        const pdfJsPage = await pdfJsDoc.getPage(pageNum);
        const scale = 2.0;
        const viewport = pdfJsPage.getViewport({ scale });
        
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not create canvas 2D context");
        }

        await pdfJsPage.render({ canvasContext: context, viewport }).promise;

        setStatusText(`Running OCR on page ${pageNum} of ${pageCount}...`);
        
        // Run OCR on the page canvas
        const { data } = await worker.recognize(canvas);
        
        // Get target pdf-lib page
        const pdfLibPage = pdfDoc.getPage(pageNum - 1);
        const { width: pdfPageWidth, height: pdfPageHeight } = pdfLibPage.getSize();

        // Canvas / Image dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Draw transparent words on top
        if (data && data.words) {
          setStatusText(`Overlaying text layer for page ${pageNum}...`);
          for (const word of data.words) {
            const { bbox, text } = word;
            if (!bbox || !text) continue;

            const w = bbox.x1 - bbox.x0;
            const h = bbox.y1 - bbox.y0;

            // Map coordinates from top-left (canvas) to bottom-left (PDF)
            const scaleX = pdfPageWidth / canvasWidth;
            const scaleY = pdfPageHeight / canvasHeight;

            const pdfW = w * scaleX;
            const pdfH = h * scaleY;
            const pdfX = bbox.x0 * scaleX;
            const pdfY = pdfPageHeight - (bbox.y1 * scaleY);

            // Font size estimate
            const fontSize = Math.max(1, pdfH * 0.85);

            pdfLibPage.drawText(text, {
              x: pdfX,
              y: pdfY,
              size: fontSize,
              maxWidth: pdfW,
              opacity: 0, // Make text completely invisible but searchable/selectable
            });
          }
        }

        // Calculate aggregate progress
        const overallProgress = 15 + Math.round((pageNum / pageCount) * 80);
        setProgress(overallProgress);
        
        // Clean up canvas memory
        canvas.width = 0;
        canvas.height = 0;
      }

      setStatusText("Compiling final searchable PDF...");
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);

      // Chain result
      setSharedFile(new File([blob], filename, { type: "application/pdf" }));

      toast({
        title: "OCR Complete",
        description: "Your PDF is now fully searchable and selectable.",
      });
      setProgress(100);
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "OCR Failed",
        description: "An error occurred while recognizing text on this file.",
        variant: "destructive",
      });
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setStatusText("");
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ocr-lang">Recognition Language</Label>
        <Select value={ocrLanguage} onValueChange={setOcrLanguage}>
          <SelectTrigger id="ocr-lang" className="cursor-pointer">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eng">English (eng)</SelectItem>
            <SelectItem value="spa">Spanish (spa)</SelectItem>
            <SelectItem value="fra">French (fra)</SelectItem>
            <SelectItem value="deu">German (deu)</SelectItem>
            <SelectItem value="ita">Italian (ita)</SelectItem>
            <SelectItem value="por">Portuguese (por)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button onClick={handleRunOcr} disabled={isProcessing} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <SearchCode className="mr-2 h-4 w-4" />
        )}
        Run Offline OCR
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="OCR & Make Searchable"
          description="Transform scanned (image-only) PDFs into fully searchable, selectable documents. Done entirely inside your browser so nothing ever leaves your device."
          optionsPanel={file ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload scanned PDF to run character recognition"
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
                  {!isProcessing && (
                    <Button variant="ghost" size="icon" onClick={clearAll} className="cursor-pointer">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isProcessing && (
                  <div className="p-6 rounded-lg bg-muted border space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{statusText}</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      * OCR runs locally using WebAssembly. This might take a few seconds per page depending on your computer's speed.
                    </p>
                  </div>
                )}

                {!isProcessing && (
                  <div className="flex gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <p>
                      <strong>100% Private:</strong> Character recognition runs locally on your machine. No documents are uploaded to any servers.
                    </p>
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
