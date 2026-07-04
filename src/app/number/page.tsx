"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ThumbnailGrid, GridItem } from "@/components/ThumbnailGrid";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, PlusCircle, FileText } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfFile {
  id: string;
  file: File;
  previewUrl: string;
  pageNumber: number; // For mapping in ThumbnailGrid
}

export default function NumberPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Customization options
  const [position, setPosition] = useState("bottom-center");
  const [margin, setMargin] = useState(36);
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState("Page {p} of {n}");

  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (uploadedFiles: File[]) => {
      if (!uploadedFiles || uploadedFiles.length === 0) return;
      setIsLoading(true);

      const largeFiles = uploadedFiles.filter((f) => f.size > 30 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "Large file detected",
          description: "Processing may take longer and use significant memory on this device.",
        });
      }
      setProgress(0);

      const newPdfFiles: PdfFile[] = [];
      let processedFiles = 0;
      const totalFiles = uploadedFiles.length;

      let currentFileNumber = files.length + 1;
      for (const file of uploadedFiles) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file type",
            description: `Skipped ${file.name} as it's not a PDF.`,
            variant: "destructive",
          });
          continue;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }

          newPdfFiles.push({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: canvas.toDataURL(),
            pageNumber: currentFileNumber++,
          });
          canvas.width = canvas.height = 0; // free memory
        } catch (error) {
          console.error("Error processing file preview:", error);
          toast({
            title: "Preview Error",
            description: `Could not create a preview for ${file.name}.`,
            variant: "destructive",
          });
        }
        processedFiles++;
        setProgress(Math.round((processedFiles / totalFiles) * 100));
      }
      setFiles((f) => [...f, ...newPdfFiles]);
      setIsLoading(false);
    },
    [toast, files.length]
  );

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("preset_numbering");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.position) setPosition(config.position);
        if (config.margin !== undefined) setMargin(config.margin);
        if (config.fontSize) setFontSize(config.fontSize);
        if (config.format) setFormat(config.format);
      } catch (e) {
        console.error("Error loading numbering preset:", e);
      }
    }
  }, []);

  const handleSavePreset = () => {
    const config = {
      position,
      margin,
      fontSize,
      format,
    };
    localStorage.setItem("preset_numbering", JSON.stringify(config));
    toast({ title: "Preset Saved", description: "Your current numbering settings have been saved as default." });
  };

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFilesChange([sharedFile]);
      clearSharedFile();
    }
  }, [sharedFile, handleFilesChange, clearSharedFile]);

  const handleDelete = (id: string) => {
    setFiles((currentFiles) => {
      const filtered = currentFiles.filter((f) => f.id !== id);
      return filtered.map((f, idx) => ({ ...f, pageNumber: idx + 1 }));
    });
  };

  const handleDownload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload at least one PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (files.length === 1) {
        // Single file flow
        const pdfFile = files[0];
        const existingPdfBytes = await pdfFile.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        for (let i = 0; i < totalPages; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          const pageNumberText = format
            .replace("{p}", String(i + 1))
            .replace("{n}", String(totalPages));

          const textWidth = helveticaFont.widthOfTextAtSize(pageNumberText, fontSize);
          const yMargin = position.includes("top") ? height - margin - fontSize : margin;
          const xMargin = (() => {
            if (position.includes("left")) return margin;
            if (position.includes("center")) return width / 2 - textWidth / 2;
            return width - margin - textWidth; // right
          })();

          page.drawText(pageNumberText, {
            x: xMargin,
            y: yMargin,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `numbered-${pdfFile.file.name}`;
        saveAs(blob, finalFilename);

        // Chain result
        setSharedFile(new File([blob], finalFilename, { type: "application/pdf" }));
      } else {
        // Multi-file ZIP download flow
        const zip = new JSZip();
        let firstFile: File | null = null;

        for (const pdfFile of files) {
          const existingPdfBytes = await pdfFile.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const pages = pdfDoc.getPages();
          const totalPages = pages.length;

          for (let i = 0; i < totalPages; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            const pageNumberText = format
              .replace("{p}", String(i + 1))
              .replace("{n}", String(totalPages));

            const textWidth = helveticaFont.widthOfTextAtSize(pageNumberText, fontSize);
            const yMargin = position.includes("top") ? height - margin - fontSize : margin;
            const xMargin = (() => {
              if (position.includes("left")) return margin;
              if (position.includes("center")) return width / 2 - textWidth / 2;
              return width - margin - textWidth; // right
            })();

            page.drawText(pageNumberText, {
              x: xMargin,
              y: yMargin,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          }

          const pdfBytes = await pdfDoc.save();
          const finalFilename = `numbered-${pdfFile.file.name}`;
          zip.file(finalFilename, pdfBytes);

          if (!firstFile) {
            firstFile = new File([new Blob([pdfBytes], { type: "application/pdf" })], finalFilename, {
              type: "application/pdf",
            });
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "numbered-pdfs.zip");

        // Chain the first file
        if (firstFile) {
          setSharedFile(firstFile);
        }
      }

      toast({
        title: "Success",
        description: `${files.length} PDF(s) have been numbered and downloaded.`,
      });
    } catch (error) {
      console.error("Error adding page numbers:", error);
      toast({
        title: "Error",
        description: "Could not add page numbers to one or more PDFs.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setIsProcessing(false);
    setIsLoading(false);
    toast({ title: "Cleared", description: "All files have been removed." });
  };

  const gridItems: GridItem[] = files.map((f) => ({
    id: f.id,
    title: f.file.name,
    thumbnailUrl: f.previewUrl,
    pageNumber: f.pageNumber,
    subtitle: f.file.name,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Position</Label>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="cursor-pointer">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top-left">Top Left</SelectItem>
            <SelectItem value="top-center">Top Center</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="bottom-center">Bottom Center</SelectItem>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="margin">Margin (in points)</Label>
        <Input id="margin" type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Input id="fontSize" type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Format</Label>
        <Input id="format" value={format} onChange={(e) => setFormat(e.target.value)} />
        <p className="text-[11px] text-muted-foreground">
          Use {"{p}"} for page number and {"{n}"} for total pages.
        </p>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" onClick={handleSavePreset} className="flex-1 text-xs cursor-pointer">
          Save Preset
        </Button>
      </div>

      <Button onClick={handleDownload} disabled={isProcessing || isLoading || files.length === 0} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Number & Download All
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Add Page Numbers to PDF"
          description="Easily insert page numbers into your PDF document. Customize the position, style, and format to fit your needs perfectly."
          optionsPanel={files.length > 0 ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={files.length}
            isLoading={isLoading && files.length === 0}
            progress={progress}
            onFilesChange={handleFilesChange}
            multiple={true}
            description="Upload one or more PDFs to add page numbers"
          >
            {files.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <h2 className="text-xl font-semibold">Your Files ({files.length})</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("file-uploader-input")?.click()} className="text-xs cursor-pointer">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Upload More
                    </Button>
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

                <ThumbnailGrid
                  items={gridItems}
                  onItemsOrderChange={() => {}} // Disabled reordering in numbering tool
                  onItemDelete={handleDelete}
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
