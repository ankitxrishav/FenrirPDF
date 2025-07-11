"use client";

import React, { useState, useCallback } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
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
  Image as ImageIcon,
  Type
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("watermarked.pdf");
  
  // Watermark options
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileChange = useCallback(
    async (uploadedFile: File | null) => {
      if (!uploadedFile) return;
      if (uploadedFile.type !== "application/pdf") {
        toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
        return;
      }
      setFile(uploadedFile);
      setFilename(`watermarked-${uploadedFile.name}`);
    },
    [toast]
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast({ title: "Invalid image type", description: "Please upload a PNG or JPG file.", variant: "destructive" });
    }
  };
  
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
    if (watermarkType === "image" && !imageFile) {
        toast({ title: "No image selected", description: "Please upload an image for the watermark.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      let watermarkAsset: any;
      if(watermarkType === 'text') {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        watermarkAsset = { font, text }
      } else if(imageFile) {
        const imageBytes = await imageFile.arrayBuffer();
        watermarkAsset = await pdfDoc.embedPng(imageBytes);
      }

      for (const page of pages) {
        const { width, height } = page.getSize();
        
        if (watermarkType === 'text') {
          page.drawText(watermarkAsset.text, {
            x: width / 2 - (watermarkAsset.font.widthOfTextAtSize(watermarkAsset.text, fontSize) / 2),
            y: height / 2 - fontSize / 2,
            size: fontSize,
            font: watermarkAsset.font,
            color: rgb(0, 0, 0),
            opacity: opacity,
            rotate: degrees(rotation),
          });
        } else if (watermarkAsset) {
          const scaled = watermarkAsset.scale(0.5);
           page.drawImage(watermarkAsset, {
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
      saveAs(blob, filename);
    } catch (error) {
        console.error("Error adding watermark:", error);
        toast({ title: "Error", description: "Could not add watermark to the PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setFile(null);
    setIsProcessing(false);
    setImageFile(null);
    setImagePreview(null);
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
              Upload a single PDF to add a watermark
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
                    <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-primary"/>
                        <span className="font-semibold">{file.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button onClick={handleDownload} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                            Watermark & Download
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
