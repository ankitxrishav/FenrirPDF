"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument, PageSizes, rgb, BlendMode } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfFile {
  id: string;
  file: File;
  previewUrl: string;
  pageCount: number;
}

export default function FourInOnePage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [pdfFile, setPdfFile] = useState<PdfFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [invertColors, setInvertColors] = useState(false);
  const [layout, setLayout] = useState<"2" | "4" | "8">("4");

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

      setIsLoading(true);
      setProgress(0);

      // Warn for large files
      if (uploadedFile.size > 30 * 1024 * 1024) {
        toast({
          title: "Large file detected",
          description: "Processing may take longer and use significant memory on this device.",
        });
      }

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (context) {
          await firstPage.render({ canvasContext: context, viewport }).promise;
        }

        setPdfFile({
          id: `${uploadedFile.name}-${uploadedFile.lastModified}`,
          file: uploadedFile,
          previewUrl: canvas.toDataURL(),
          pageCount: pdf.numPages,
        });
        canvas.width = canvas.height = 0; // free memory
      } catch (error) {
        console.error("Error processing file preview:", error);
        toast({
          title: "Preview Error",
          description: `Could not create a preview for ${uploadedFile.name}.`,
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

  const handleDownload = async () => {
    if (!pdfFile) {
      toast({
        title: "No file to process",
        description: "Please upload a PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await pdfFile.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdf = await PDFDocument.create();
      const pageCount = pdfDoc.getPageCount();
      const pagesPerSheet = parseInt(layout, 10);
      const margin = 18;

      const [a4Width, a4Height] = PageSizes.A4;
      const [pageWidth, pageHeight] =
        orientation === "portrait" ? [a4Width, a4Height] : [a4Height, a4Width];

      for (let i = 0; i < pageCount; i += pagesPerSheet) {
        const newPage = newPdf.addPage([pageWidth, pageHeight]);

        const pagesToDraw = pdfDoc.getPages().slice(i, i + pagesPerSheet);
        const embeddedPages = await newPdf.embedPages(pagesToDraw);

        let cols, rows;
        if (orientation === "portrait") {
          if (pagesPerSheet === 2) {
            cols = 1;
            rows = 2;
          } else if (pagesPerSheet === 4) {
            cols = 2;
            rows = 2;
          } else {
            cols = 2;
            rows = 4;
          } // 8
        } else {
          // landscape
          if (pagesPerSheet === 2) {
            cols = 2;
            rows = 1;
          } else if (pagesPerSheet === 4) {
            cols = 2;
            rows = 2;
          } else {
            cols = 4;
            rows = 2;
          } // 8
        }

        const availableWidth = pageWidth - (cols + 1) * margin;
        const availableHeight = pageHeight - (rows + 1) * margin;
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;

        embeddedPages.forEach((embeddedPage, index) => {
          const scale = Math.min(cellWidth / embeddedPage.width, cellHeight / embeddedPage.height);
          const scaledWidth = embeddedPage.width * scale;
          const scaledHeight = embeddedPage.height * scale;

          const col = index % cols;
          const row = Math.floor(index / cols);

          const x = margin + col * (cellWidth + margin);
          const y = pageHeight - margin - (row + 1) * cellHeight - row * margin;

          const xOffset = (cellWidth - scaledWidth) / 2;
          const yOffset = (cellHeight - scaledHeight) / 2;

          newPage.drawPage(embeddedPage, {
            x: x + xOffset,
            y: y + yOffset,
            width: scaledWidth,
            height: scaledHeight,
          });
        });
      }

      if (invertColors) {
        const pages = newPdf.getPages();
        for (const page of pages) {
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

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFilename = `${layout}-in-1-${pdfFile.file.name}`;
      saveAs(blob, finalFilename);

      // Chain result
      setSharedFile(new File([blob], finalFilename, { type: "application/pdf" }));

      toast({ title: "Success", description: `Your PDF has been processed and downloaded.` });
    } catch (error) {
      console.error("Error creating combined PDF:", error);
      toast({
        title: "Error",
        description: "Could not create the combined PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setPdfFile(null);
    setIsProcessing(false);
    setIsLoading(false);
    toast({ title: "Cleared", description: "The file has been removed." });
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Layout (Pages per Sheet)</Label>
        <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
          <SelectTrigger className="cursor-pointer">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Pages</SelectItem>
            <SelectItem value="4">4 Pages</SelectItem>
            <SelectItem value="8">8 Pages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Orientation</Label>
        <RadioGroup value={orientation} onValueChange={(v: any) => setOrientation(v)} className="flex gap-4 pt-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="portrait" id="opt-portrait" className="cursor-pointer" />
            <Label htmlFor="opt-portrait" className="cursor-pointer">Portrait</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="landscape" id="opt-landscape" className="cursor-pointer" />
            <Label htmlFor="opt-landscape" className="cursor-pointer">Landscape</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="invert-colors"
          checked={invertColors}
          onCheckedChange={(checked) => setInvertColors(!!checked)}
          className="cursor-pointer"
        />
        <Label htmlFor="invert-colors" className="text-sm font-medium cursor-pointer">
          Invert Colors (Difference Mode)
        </Label>
      </div>

      <Button onClick={handleDownload} disabled={isProcessing || isLoading || !pdfFile} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Combine & Download
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Combine PDF Pages"
          description="Arrange multiple pages of your PDF onto a single sheet. Choose your layout, orientation, and download instantly."
          optionsPanel={pdfFile ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={pdfFile ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload a single PDF to combine its pages"
          >
            {pdfFile && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{pdfFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{pdfFile.pageCount} pages</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearAll} className="cursor-pointer">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">First Page Preview</h3>
                  <div className="w-full max-w-sm aspect-[3/4] border bg-muted rounded-xl overflow-hidden shadow-md">
                    <img src={pdfFile.previewUrl} alt="First page preview" className="w-full h-full object-contain" />
                  </div>
                </div>

                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
