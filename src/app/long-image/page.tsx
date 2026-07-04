"use client";

import React, { useState, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

export default function LongImagePage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("long-image.png");
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [imageWidth, setImageWidth] = useState<"800" | "1200" | "1600">("1200");

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
      setFilename(`${uploadedFile.name.replace(/\.pdf$/i, "")}-long.${format}`);
    },
    [toast, format]
  );

  // Update filename suffix when format changes
  useEffect(() => {
    if (file) {
      setFilename((prev) => prev.replace(/\.(png|jpeg)$/i, `.${format}`));
    }
  }, [format, file]);

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFileChange(sharedFile);
      clearSharedFile();
    }
  }, [sharedFile, handleFileChange, clearSharedFile]);

  const handleGenerateLongImage = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      const targetWidth = parseInt(imageWidth, 10);
      const renderedPages: HTMLCanvasElement[] = [];
      let totalHeight = 0;

      // Render all pages to separate temporary canvas elements
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        setProgress(10 + Math.round((pageNum / pageCount) * 70));
        
        const page = await pdf.getPage(pageNum);
        const originalViewport = page.getViewport({ scale: 1.0 });
        
        // Calculate viewport scale to match our standard width
        const scale = targetWidth / originalViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not create canvas 2D context");
        }

        await page.render({ canvasContext: ctx, viewport }).promise;
        renderedPages.push(canvas);
        totalHeight += viewport.height;
      }

      // Create a master stitching canvas
      const mainCanvas = document.createElement("canvas");
      mainCanvas.width = targetWidth;
      mainCanvas.height = totalHeight;
      const mainCtx = mainCanvas.getContext("2d");

      if (!mainCtx) {
        throw new Error("Could not create main canvas 2D context");
      }

      // Draw all page canvases stacked vertically
      let currentY = 0;
      for (const pageCanvas of renderedPages) {
        mainCtx.drawImage(pageCanvas, 0, currentY);
        currentY += pageCanvas.height;
        
        // Free memory for page canvas
        pageCanvas.width = pageCanvas.height = 0;
      }

      setProgress(90);

      // Export file
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        mainCanvas.toBlob((b) => resolve(b), mimeType, 0.95);
      });

      if (!blob) {
        throw new Error("Canvas export failed");
      }

      saveAs(blob, filename);

      // Chain output
      setSharedFile(new File([blob], filename, { type: mimeType }));

      toast({
        title: "Success",
        description: "PDF pages successfully stitched into a single long image.",
      });
      setProgress(100);

      // Free master canvas memory
      mainCanvas.width = mainCanvas.height = 0;
    } catch (error) {
      console.error("Stitching error:", error);
      toast({
        title: "Stitching Failed",
        description: "An error occurred while compiling the long image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="image-format">Image Format</Label>
        <Select value={format} onValueChange={(v: any) => setFormat(v)}>
          <SelectTrigger id="image-format" className="cursor-pointer">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG (Lossless)</SelectItem>
            <SelectItem value="jpeg">JPEG (Compact)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image-width">Stitched Image Width</Label>
        <Select value={imageWidth} onValueChange={(v: any) => setImageWidth(v)}>
          <SelectTrigger id="image-width" className="cursor-pointer">
            <SelectValue placeholder="Width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="800">800px (Mobile Optimized)</SelectItem>
            <SelectItem value="1200">1200px (Standard HD)</SelectItem>
            <SelectItem value="1600">1600px (High Quality)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button onClick={handleGenerateLongImage} disabled={isProcessing} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" />
        )}
        Stitch Pages to Image
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="PDF to Long Image"
          description="Stitch all pages of your PDF document vertically into a single tall image file. Perfect for sharing flyers, slides, resumes, or documents on social channels."
          optionsPanel={file ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload PDF to stitch all pages into a vertical layout"
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
                      <span className="font-medium text-foreground">Rendering and stitching pages...</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
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
