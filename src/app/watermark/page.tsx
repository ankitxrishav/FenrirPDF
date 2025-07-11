
"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
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
  Image as ImageIcon,
  Type,
  Trash2,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function WatermarkPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Watermark options
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Invalid image type", description: "Please upload a PNG or JPG file.", variant: "destructive" });
    }
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, [handleFilesChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleDelete = (id: string) => {
    setFiles(currentFiles => currentFiles.filter(f => f.id !== id));
  };

  const handleDownload = async () => {
    if (files.length === 0) {
        toast({ title: "No files to process", description: "Please upload at least one PDF.", variant: "destructive" });
        return;
    }
    if (watermarkType === "image" && !imageFile) {
        toast({ title: "No image selected", description: "Please upload an image for the watermark.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    try {
      let watermarkAsset: any = null;
      let watermarkAssetType: 'text' | 'image' | null = null;
      
      if (watermarkType === 'image' && imageFile) {
        const imageBytes = await imageFile.arrayBuffer();
        if (imageFile.type === 'image/png') {
          watermarkAsset = imageBytes;
          watermarkAssetType = 'image';
        } else if (imageFile.type === 'image/jpeg') {
          watermarkAsset = imageBytes;
          watermarkAssetType = 'image';
        }
      }

      for (const pdfFile of files) {
          const existingPdfBytes = await pdfFile.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          
          let embeddedAsset;
          if (watermarkAssetType === 'image') {
              if (imageFile?.type === 'image/png') {
                embeddedAsset = await pdfDoc.embedPng(watermarkAsset);
              } else if (imageFile?.type === 'image/jpeg') {
                embeddedAsset = await pdfDoc.embedJpg(watermarkAsset);
              }
          } else { // text
              embeddedAsset = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          }

          const pages = pdfDoc.getPages();
          for (const page of pages) {
            const { width, height } = page.getSize();
            
            if (watermarkType === 'text') {
              page.drawText(text, {
                x: width / 2 - (embeddedAsset.widthOfTextAtSize(text, fontSize) / 2),
                y: height / 2 - fontSize / 2,
                size: fontSize,
                font: embeddedAsset,
                color: rgb(0, 0, 0),
                opacity: opacity,
                rotate: degrees(rotation),
              });
            } else if (embeddedAsset) {
              const scaled = embeddedAsset.scale(0.5);
               page.drawImage(embeddedAsset, {
                x: width / 2 - scaled.width / 2,
                y: height / 2 - scaled.height / 2,
                width: scaled.width,
                height: scaled.height,
                opacity: opacity,
                rotate: degrees(rotation),
              });
            }
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const finalFilename = `watermarked-${pdfFile.file.name}`;
          saveAs(blob, finalFilename);
      }
      toast({ title: "Success", description: `${files.length} PDF(s) have been watermarked and downloaded.` });
    } catch (error) {
        console.error("Error adding watermark:", error);
        toast({ title: "Error", description: "Could not add watermark to one or more PDFs.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setFiles([]);
    setIsProcessing(false);
    setIsLoading(false);
    setImageFile(null);
    setImagePreview(null);
    toast({ title: "Cleared", description: "All files and settings have been cleared." });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Add Watermark to PDF</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Stamp a text or image watermark onto your PDF files. Customize the appearance and placement with ease.
            </p>
        </div>
        {files.length === 0 && !isLoading ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()}/>
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
              Drag & Drop or <button type="button" className="text-accent underline" onClick={open}>Click to Upload</button>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Upload one or more PDFs to add a watermark
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Watermark Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Tabs value={watermarkType} onValueChange={(v) => setWatermarkType(v as any)} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="text"><Type className="w-4 h-4 mr-2"/>Text</TabsTrigger>
                            <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2"/>Image</TabsTrigger>
                          </TabsList>
                          <TabsContent value="text" className="space-y-6 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="watermark-text">Watermark Text</Label>
                                <Input id="watermark-text" value={text} onChange={e => setText(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="font-size">Font Size</Label>
                                <Input id="font-size" type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
                              </div>
                          </TabsContent>
                          <TabsContent value="image" className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="image-upload">Upload Image (PNG/JPG)</Label>
                                <Input id="image-upload" type="file" accept="image/png, image/jpeg" onChange={handleImageFileChange} />
                              </div>
                              {imagePreview && (
                                <div className="border rounded-md p-2">
                                  <img src={imagePreview} alt="Watermark preview" className="max-w-full h-auto" />
                                </div>
                              )}
                          </TabsContent>
                        </Tabs>
                        
                        <div className="space-y-4 pt-6 border-t mt-6">
                           <div className="space-y-2">
                              <Label>Opacity ({Math.round(opacity * 100)}%)</Label>
                              <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={0} max={1} step={0.05} />
                           </div>
                           <div className="space-y-2">
                              <Label>Rotation ({rotation}°)</Label>
                              <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={-180} max={180} step={5} />
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                 <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold">Your Files ({files.length})</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button onClick={open} variant="outline" disabled={isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Upload More
                        </Button>
                        <Button onClick={handleDownload} disabled={isProcessing || isLoading || files.length === 0}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                            Watermark & Download All
                        </Button>
                        <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                    </div>
                </div>
                 {isLoading && files.length === 0 && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-md space-y-2">
                            <Progress value={progress} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
                        </div>
                    </div>
                )}
                <div 
                  {...getRootProps()}
                  className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border border-dashed rounded-lg min-h-[200px] transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-transparent'}`}
                >
                    <input {...getInputProps()}/>
                    {files.map((pdfFile) => (
                        <FileThumbnail key={pdfFile.id} pdfFile={pdfFile} onDelete={handleDelete} />
                    ))}
                     {isLoading && (
                      <div className="flex flex-col items-center justify-center aspect-[3/4] p-4 border border-dashed rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <p className="mt-2 text-sm text-center text-muted-foreground">Loading...</p>
                        <Progress value={progress} className="w-full mt-2" />
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
