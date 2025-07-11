"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  PlusCircle,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfFile {
  id: string;
  file: File;
  previewUrl: string;
}

const FileThumbnail: React.FC<{ pdfFile: PdfFile; onDelete: (id: string) => void; }> = ({ pdfFile, onDelete }) => {
  return (
    <Card className="relative group overflow-hidden shadow-md">
      <CardContent className="p-0 aspect-[3/4] flex items-center justify-center bg-muted">
        <img
          src={pdfFile.previewUrl}
          alt={`Preview of ${pdfFile.file.name}`}
          className="w-full h-full object-contain"
        />
      </CardContent>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDelete(pdfFile.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 px-2 truncate">
        {pdfFile.file.name}
      </div>
    </Card>
  );
};

export default function NumberPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Customization options
  const [position, setPosition] = useState("bottom-center");
  const [margin, setMargin] = useState(36);
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState("Page {p} of {n}");
  const [outputFilename, setOutputFilename] = useState("numbered.pdf");

  const { toast } = useToast();
  
  const handleFilesChange = useCallback(async (uploadedFiles: File[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsLoading(true);
    setProgress(0);

    const newPdfFiles: PdfFile[] = [];
    let processedFiles = 0;
    const totalFiles = uploadedFiles.length;

    for (const file of uploadedFiles) {
        if (file.type !== "application/pdf") {
            toast({ title: "Invalid file type", description: `Skipped ${file.name} as it's not a PDF.`, variant: "destructive" });
            continue;
        };

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
                id: `${file.name}-${file.lastModified}`,
                file,
                previewUrl: canvas.toDataURL(),
            });
        } catch (error) {
            console.error("Error processing file preview:", error);
            toast({ title: "Preview Error", description: `Could not create a preview for ${file.name}.`, variant: "destructive" });
        }
        processedFiles++;
        setProgress(Math.round((processedFiles / totalFiles) * 100));
    }
    setFiles(f => [...f, ...newPdfFiles]);
    setIsLoading(false);
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, [handleFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleDelete = (id: string) => {
    setFiles(currentFiles => currentFiles.filter(f => f.id !== id));
  };

  const handleDownload = async () => {
    if (files.length === 0) return;

    if (files.length > 1) {
        toast({ title: "Feature limitation", description: "Numbering multiple PDFs at once will be supported soon. For now, please process one PDF at a time.", variant: "destructive" });
        return;
    }
    const fileToProcess = files[0].file;

    setIsProcessing(true);
    try {
      const existingPdfBytes = await fileToProcess.arrayBuffer();
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
        
        let x, y;
        const yMargin = position.includes("top") ? height - margin - fontSize : margin;
        const xMargin = (() => {
            if (position.includes("left")) return margin;
            if (position.includes("center")) return width / 2 - textWidth / 2;
            return width - margin - textWidth; // right
        })();
        
        page.drawText(pageNumberText, { x: xMargin, y: yMargin, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFilename = files.length === 1 ? `numbered-${files[0].file.name}` : outputFilename;
      saveAs(blob, finalFilename);
    } catch (error) {
        console.error("Error adding page numbers:", error);
        toast({ title: "Error", description: "Could not add page numbers to the PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setFiles([]);
    setIsProcessing(false);
    setIsLoading(false);
  }

  const handleFileUploadClick = () => {
    const el = document.getElementById('file-upload-input');
    if (el) el.click();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Add Page Numbers to PDF</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Easily insert page numbers into your PDF document. Customize the position, style, and format to fit your needs perfectly.
            </p>
        </div>
        {files.length === 0 && !isLoading ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
             onClick={(e) => e.preventDefault()}
          >
            <input {...getInputProps()} id="file-upload-input" />
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag & Drop or <span className="text-accent underline" onClick={handleFileUploadClick}>Click to Upload</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload one or more PDFs to add page numbers
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Customization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Position</Label>
                             <Select value={position} onValueChange={setPosition}>
                                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
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
                            <Input id="margin" type="number" value={margin} onChange={e => setMargin(Number(e.target.value))}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="fontSize">Font Size</Label>
                            <Input id="fontSize" type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="format">Format</Label>
                            <Input id="format" value={format} onChange={e => setFormat(e.target.value)}/>
                            <p className="text-xs text-muted-foreground">Use {"{p}"} for page number and {"{n}"} for total pages.</p>
                        </div>
                         {files.length > 1 && <div className="space-y-2">
                            <Label htmlFor="filename">Output Filename (for multiple files)</Label>
                            <Input id="filename" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} />
                        </div>}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold">Your Files ({files.length})</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button onClick={handleDownload} disabled={isProcessing || isLoading || files.length === 0}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                            Number & Download
                        </Button>
                        <Button variant="outline" onClick={handleFileUploadClick} disabled={isLoading}>
                           <PlusCircle className="mr-2 h-4 w-4" /> Add More
                        </Button>
                        <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                    </div>
                </div>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-md space-y-2">
                            <Progress value={progress} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((pdfFile) => (
                        <FileThumbnail key={pdfFile.id} pdfFile={pdfFile} onDelete={handleDelete} />
                    ))}
                     {isLoading && (
                      <div className="flex flex-col items-center justify-center aspect-[3/4] p-4 border border-dashed rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <p className="mt-2 text-sm text-center text-muted-foreground">Loading...</p>
                      </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
