"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { useDropzone } from 'react-dropzone';

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NumberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("numbered.pdf");
  
  // Customization options
  const [position, setPosition] = useState("bottom-center");
  const [margin, setMargin] = useState(36);
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState("page {p} of {n}");

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
      setFilename(`numbered-${uploadedFile.name}`);
    },
    [toast]
  );
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  }, [handleFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleDownload = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
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

        if (position.includes("bottom")) {
            y = margin;
        } else { // top
            y = height - margin - fontSize;
        }

        if (position.includes("left")) {
            x = margin;
        } else if (position.includes("center")) {
            x = width / 2 - textWidth / 2;
        } else { // right
            x = width - margin - textWidth;
        }

        page.drawText(pageNumberText, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
        console.error("Error adding page numbers:", error);
        toast({ title: "Error", description: "Could not add page numbers to the PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setFile(null);
    setIsProcessing(false);
  }

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
        {!file ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag & Drop or Click to Upload
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload a single PDF to add page numbers
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
                                <SelectTrigger>
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
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                    <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-primary"/>
                        <span className="font-semibold">{file.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button onClick={handleDownload} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                            Number & Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="filename">Output Filename</Label>
                    <Input id="filename" value={filename} onChange={e => setFilename(e.target.value)} />
                </div>

                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center p-4">
                    <p className="text-muted-foreground">PDF preview will be available soon.</p>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
