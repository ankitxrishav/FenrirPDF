
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
  RefreshCcw,
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
}

export default function InvertPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [pagesToInvert, setPagesToInvert] = useState<Set<number>>(new Set());
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

    clearAll(false);
    setIsLoading(true);
    setProgress(0);
    setPdfFile(uploadedFile);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const newPages: PdfPage[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
        }

        newPages.push({
            id: `${uploadedFile.name}-page-${i}`,
            previewUrl: canvas.toDataURL(),
            pageNumber: i,
        });
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

  const toggleInvertPage = (pageNumber: number) => {
    setPagesToInvert(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pageNumber)) {
            newSet.delete(pageNumber);
        } else {
            newSet.add(pageNumber);
        }
        return newSet;
    });
  }

  const toggleSelectAll = () => {
    if (pagesToInvert.size === pages.length) {
      setPagesToInvert(new Set());
    } else {
      const allPageNumbers = new Set(pages.map(p => p.pageNumber));
      setPagesToInvert(allPageNumbers);
    }
  };

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

        pagesToInvert.forEach(pageNumber => {
            const pageIndex = pageNumber - 1;
            if (pageIndex >= 0 && pageIndex < pdfPages.length) {
                const page = pdfPages[pageIndex];
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
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `inverted-${pdfFile.name}`;
        saveAs(blob, finalFilename);
        toast({ title: "Success", description: `Your PDF has been processed and downloaded.` });
    } catch (error) {
        console.error("Error inverting PDF pages:", error);
        toast({ title: "Error", description: "Could not process the PDF for inversion.", variant: "destructive" });
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
    if(showToast) toast({ title: "Cleared", description: "The file has been removed." });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Invert PDF Colors</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Selectively invert the colors of specific pages in your PDF. Click on a page to mark it for inversion.
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
              Upload a PDF to selectively invert its pages
            </p>
          </div>
        ) : (isLoading && pages.length === 0) ? (
             <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="w-full max-w-md space-y-4">
                    <p className="text-lg text-center text-muted-foreground">
                      Generating page previews...
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
                           {pagesToInvert.size > 0 ? `${pagesToInvert.size} of ${pages.length} pages marked for inversion.` : `Click on pages to select them for inversion.`}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                   <Button onClick={toggleSelectAll} variant="secondary">
                    {pagesToInvert.size === pages.length ? 'Deselect All' : 'Select All'}
                   </Button>
                   <Button onClick={handleDownload} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                     <Button variant="outline" onClick={open}>
                        Upload Another
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => clearAll(true)}><X className="h-4 w-4"/></Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map(page => (
                <div key={page.id} className="relative group cursor-pointer" onClick={() => toggleInvertPage(page.pageNumber)}>
                  <Card className={`overflow-hidden shadow-md transition-all ${pagesToInvert.has(page.pageNumber) ? 'ring-2 ring-accent' : ''}`}>
                     <CardContent className="p-0 aspect-[3/4] flex items-center justify-center bg-muted">
                        <img
                        src={page.previewUrl}
                        alt={`Preview of page ${page.pageNumber}`}
                        className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${pagesToInvert.has(page.pageNumber) ? 'scale-105' : ''}`}
                        />
                    </CardContent>
                  </Card>
                   <div 
                     className={`absolute inset-0 bg-accent/80 flex flex-col items-center justify-center text-accent-foreground transition-opacity ${pagesToInvert.has(page.pageNumber) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                   >
                     <RefreshCcw className="w-8 h-8" />
                     <span className="mt-2 font-semibold">{pagesToInvert.has(page.pageNumber) ? 'Selected' : 'Invert'}</span>
                   </div>
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
