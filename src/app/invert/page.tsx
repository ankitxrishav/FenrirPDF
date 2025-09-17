
"use client";

import React, { useState, useCallback } from "react";
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
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
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

export default function InvertPage() {
  const [pdfFile, setPdfFile] = useState<PdfFile | null>(null);
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
        const pages = pdfDoc.getPages();

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
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `inverted-${pdfFile.file.name}`;
        saveAs(blob, finalFilename);
        toast({ title: "Success", description: `Your PDF has been inverted and downloaded.` });
    } catch (error) {
        console.error("Error inverting PDF:", error);
        toast({ title: "Error", description: "Could not invert the PDF colors.", variant: "destructive" });
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
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Invert PDF Colors</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Easily invert the colors of your PDF document. Ideal for night mode reading or printing with less ink.
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
              Upload a PDF to invert its colors
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
                        <p className="text-sm text-foreground/80">
                            Ready to invert colors. This action will apply a color inversion effect to every page in your document.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 pt-4">
                           <Button onClick={handleDownload} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                Invert & Download
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
