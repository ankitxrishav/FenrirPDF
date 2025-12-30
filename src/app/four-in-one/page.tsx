
"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument, PageSizes, rgb, BlendMode } from "pdf-lib";
import { saveAs } from "file-saver";
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from "pdfjs-dist";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  Download,
  Loader2,
  X,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
  const [pdfFile, setPdfFile] = useState<PdfFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [invertColors, setInvertColors] = useState(false);
  const [layout, setLayout] = useState<"2" | "4" | "8">("4");

  const { toast } = useToast();

  const handleFileChange = useCallback(async (uploadedFile: File | null) => {
    if (!uploadedFile) return;
    if (uploadedFile.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress(0);

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

    } catch (error) {
      console.error("Error processing file preview:", error);
      toast({ title: "Preview Error", description: `Could not create a preview for ${uploadedFile.name}.`, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  }, [handleFileChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleDownload = async () => {
    if (!pdfFile) {
        toast({ title: "No file to process", description: "Please upload a PDF.", variant: "destructive" });
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
        const [pageWidth, pageHeight] = orientation === 'portrait' ? [a4Width, a4Height] : [a4Height, a4Width];

        for (let i = 0; i < pageCount; i += pagesPerSheet) {
          const newPage = newPdf.addPage([pageWidth, pageHeight]);
          
          const pagesToDraw = pdfDoc.getPages().slice(i, i + pagesPerSheet);
          const embeddedPages = await newPdf.embedPages(pagesToDraw);

          let cols, rows;
          if (orientation === 'portrait') {
            if (pagesPerSheet === 2) { cols = 1; rows = 2; }
            else if (pagesPerSheet === 4) { cols = 2; rows = 2; }
            else { cols = 2; rows = 4; } // 8
          } else { // landscape
            if (pagesPerSheet === 2) { cols = 2; rows = 1; }
            else if (pagesPerSheet === 4) { cols = 2; rows = 2; }
            else { cols = 4; rows = 2; } // 8
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
                    blendMode: BlendMode.Difference,
                });
            }
        }

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `${layout}-in-1-${pdfFile.file.name}`;
        saveAs(blob, finalFilename);
        toast({ title: "Success", description: `Your PDF has been processed and downloaded.` });
    } catch (error) {
        console.error("Error creating combined PDF:", error);
        toast({ title: "Error", description: "Could not create the combined PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setPdfFile(null);
    setIsProcessing(false);
    setIsLoading(false);
    toast({ title: "Cleared", description: "The file has been removed." });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Combine PDF Pages</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Arrange multiple pages of your PDF onto a single page. Choose your layout, orientation, and download instantly.
            </p>
        </div>
        {!pdfFile && !isLoading ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag & Drop or <button type="button" className="text-accent underline" onClick={open}>Click to Upload</button>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload a single PDF to get started
            </p>
          </div>
        ) : isLoading ? (
             <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="w-full max-w-md space-y-4">
                    <p className="text-lg text-center text-muted-foreground">
                    Processing your PDF...
                    </p>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                </div>
            </div>
        ) : pdfFile ? (
          <div className="flex flex-col items-center gap-8">
            <div className="w-full max-w-4xl">
              <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/3">
                         <div className="aspect-[3/4] w-full bg-muted rounded-lg overflow-hidden border">
                            <img src={pdfFile.previewUrl} alt="PDF Preview" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary"/>
                            <div>
                                <h2 className="font-semibold text-lg">{pdfFile.file.name}</h2>
                                <p className="text-sm text-muted-foreground">{pdfFile.pageCount} pages</p>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Layout</Label>
                                <Select value={layout} onValueChange={(v) => setLayout(v as any)}>
                                    <SelectTrigger><SelectValue placeholder="Select layout" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2 pages per sheet</SelectItem>
                                        <SelectItem value="4">4 pages per sheet</SelectItem>
                                        <SelectItem value="8">8 pages per sheet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Page Orientation</Label>
                                <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as any)} className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="portrait" id="portrait" />
                                        <Label htmlFor="portrait">Portrait</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="landscape" id="landscape" />
                                        <Label htmlFor="landscape">Landscape</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="invert-colors" checked={invertColors} onCheckedChange={(checked) => setInvertColors(!!checked)} />
                            <Label htmlFor="invert-colors">Invert Colors</Label>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 pt-4">
                           <Button onClick={handleDownload} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                Process & Download
                            </Button>
                             <Button variant="outline" onClick={open}>
                                Upload Another
                            </Button>
                            <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
