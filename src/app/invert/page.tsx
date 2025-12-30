
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PDFDocument, rgb, BlendMode } from "pdf-lib";
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
  FileText,
  Badge,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";


if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfPage {
  id: string;
  previewUrl: string;
  pageNumber: number;
  shouldInvert: boolean;
}

interface AnalysisResult {
    shouldInvert: boolean;
    confidence: number;
}

const analyzePageBackgroundColor = (imageData: ImageData): AnalysisResult => {
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    
    let darkPixels = 0;
    let lightPixels = 0;
    let sumIntensity = 0;

    const darkThreshold = 50;
    const lightThreshold = 205;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const intensity = 0.299 * r + 0.587 * g + 0.114 * b;
        sumIntensity += intensity;

        if (intensity < darkThreshold) {
            darkPixels++;
        }
        if (intensity > lightThreshold) {
            lightPixels++;
        }
    }

    const meanIntensity = sumIntensity / totalPixels;
    const darkRatio = darkPixels / totalPixels;
    const lightRatio = lightPixels / totalPixels;

    // A page is considered "dark background" if it has a high percentage of dark pixels
    // and a very low percentage of light pixels. This helps avoid inverting
    // white pages that are heavy with black text.
    const isDark = darkRatio > 0.7 && lightRatio < 0.1 && meanIntensity < 80;
    
    const confidence = isDark ? Math.min(1, (darkRatio - 0.7) / 0.3) : 0;

    return {
        shouldInvert: isDark,
        confidence: confidence,
    };
};

export default function InvertPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();

  const handleFileChange = useCallback(async (uploadedFile: File | null) => {
    if (!uploadedFile) return;
    if (uploadedFile.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setPdfFile(uploadedFile);
    setPages([]);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const newPages: PdfPage[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Low-res for fast analysis
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const { shouldInvert } = analyzePageBackgroundColor(imageData);
          
          // Create higher quality preview
          const previewViewport = page.getViewport({ scale: 0.8 });
          const previewCanvas = document.createElement("canvas");
          const previewContext = previewCanvas.getContext("2d");
          previewCanvas.height = previewViewport.height;
          previewCanvas.width = previewViewport.width;
          if (previewContext) {
            await page.render({ canvasContext: previewContext, viewport: previewViewport }).promise;
          }

          newPages.push({
            id: `${uploadedFile.name}-page-${i}`,
            previewUrl: previewCanvas.toDataURL(),
            pageNumber: i,
            shouldInvert: shouldInvert
          });
        }
        setProgress(Math.round((i / numPages) * 100));
      }
      setPages(newPages);

    } catch (error) {
      console.error("Error processing file:", error);
      toast({ title: "Processing Error", description: `Could not analyze the PDF file.`, variant: "destructive" });
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
        const existingPdfBytes = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pdfPages = pdfDoc.getPages();

        for (let i = 0; i < pages.length; i++) {
          if (pages[i].shouldInvert) {
            const page = pdfPages[i];
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
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `normalized-${pdfFile.name}`;
        saveAs(blob, finalFilename);
        toast({ title: "Success", description: `Your PDF has been normalized and downloaded.` });
    } catch (error) {
        console.error("Error normalizing PDF:", error);
        toast({ title: "Error", description: "Could not normalize the PDF colors.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setPdfFile(null);
    setPages([]);
    setIsProcessing(false);
    setIsLoading(false);
    toast({ title: "Cleared", description: "The file and analysis have been removed." });
  }

  const pagesToInvert = useMemo(() => pages.filter(p => p.shouldInvert).length, [pages]);
  const pagesToKeep = useMemo(() => pages.filter(p => !p.shouldInvert).length, [pages]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Normalize PDF Backgrounds</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Automatically detects and fixes dark or inverted pages so your entire document has a clean, white background.
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
              Upload a PDF to normalize its page backgrounds
            </p>
          </div>
        ) : (isLoading && pages.length === 0) ? (
             <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="w-full max-w-md space-y-4">
                    <p className="text-lg text-center text-muted-foreground">
                      Analyzing pages...
                    </p>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                </div>
            </div>
        ) : pdfFile && pages.length > 0 ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary"/>
                    <div>
                        <h2 className="font-semibold text-lg">{pdfFile.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {pagesToInvert > 0 ? `${pagesToInvert} pages will be inverted.` : `All pages seem to have a light background.`} {pagesToKeep} pages will remain unchanged.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                   <Button onClick={handleDownload} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        Normalize & Download
                    </Button>
                     <Button variant="outline" onClick={open}>
                        Upload Another
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map(page => (
                <div key={page.id} className="relative">
                  <Card className="overflow-hidden shadow-md">
                     <CardContent className="p-0 aspect-[3/4] flex items-center justify-center bg-muted">
                        <img
                        src={page.previewUrl}
                        alt={`Preview of page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                        />
                    </CardContent>
                  </Card>
                  {page.shouldInvert && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      Invert
                    </div>
                  )}
                   <div className="absolute bottom-1 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {page.pageNumber}
                    </div>
                </div>
              ))}
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}
