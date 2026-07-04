"use client";

import React, { useState, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface ExtractedImage {
  id: string;
  name: string;
  width: number;
  height: number;
  dataUrl: string;
  blob: Blob;
}

export default function ExtractImagesPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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
      setIsLoading(true);
      setImages([]);
      setProgress(5);

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        const extractedList: ExtractedImage[] = [];
        let imageCounter = 1;

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          setProgress(Math.round((pageNum / pageCount) * 90));
          const page = await pdf.getPage(pageNum);
          const opList = await page.getOperatorList();

          const fnArray = opList.fnArray;
          const argsArray = opList.argsArray;

          for (let i = 0; i < fnArray.length; i++) {
            const fn = fnArray[i];
            
            // Check if operator is an image XObject
            if (fn === pdfjsLib.OPS.paintImageXObject) {
              const imgKey = argsArray[i][0];

              // Retrieve decoded image object
              const img: any = await new Promise((resolve) => {
                page.objs.get(imgKey, (image: any) => resolve(image));
              });

              if (img && img.width && img.height && img.data) {
                // Convert raw pixel bytes to PNG data URL via Canvas
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                
                if (ctx) {
                  const imgData = ctx.createImageData(img.width, img.height);
                  const src = img.data;
                  const dest = imgData.data;

                  // Handle different formats (RGBA vs RGB vs Grayscale)
                  if (src.length === img.width * img.height * 4) {
                    dest.set(src);
                  } else if (src.length === img.width * img.height * 3) {
                    let sIdx = 0;
                    let dIdx = 0;
                    const totalPixels = img.width * img.height;
                    for (let p = 0; p < totalPixels; p++) {
                      dest[dIdx] = src[sIdx];
                      dest[dIdx + 1] = src[sIdx + 1];
                      dest[dIdx + 2] = src[sIdx + 2];
                      dest[dIdx + 3] = 255;
                      sIdx += 3;
                      dIdx += 4;
                    }
                  } else if (src.length === img.width * img.height) {
                    let sIdx = 0;
                    let dIdx = 0;
                    const totalPixels = img.width * img.height;
                    for (let p = 0; p < totalPixels; p++) {
                      const val = src[sIdx++];
                      dest[dIdx] = val;
                      dest[dIdx + 1] = val;
                      dest[dIdx + 2] = val;
                      dest[dIdx + 3] = 255;
                      dIdx += 4;
                    }
                  }

                  ctx.putImageData(imgData, 0, 0);

                  const dataUrl = canvas.toDataURL("image/png");
                  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

                  if (blob) {
                    extractedList.push({
                      id: `img-${imageCounter}`,
                      name: `extracted-image-${imageCounter}.png`,
                      width: img.width,
                      height: img.height,
                      dataUrl,
                      blob,
                    });
                    imageCounter++;
                  }
                }
                
                // Free canvas
                canvas.width = canvas.height = 0;
              }
            }
          }
        }

        setImages(extractedList);
        setProgress(100);
        
        if (extractedList.length === 0) {
          toast({
            title: "No images found",
            description: "This PDF does not contain any embedded raster image files.",
          });
        } else {
          toast({
            title: "Extraction Complete",
            description: `Successfully extracted ${extractedList.length} images from the PDF.`,
          });
        }
      } catch (error) {
        console.error("Error extracting images:", error);
        toast({
          title: "Extraction Error",
          description: "Could not parse images from this PDF.",
          variant: "destructive",
        });
        setFile(null);
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

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      if (images.length === 1) {
        // Single file direct download
        saveAs(images[0].blob, images[0].name);
      } else {
        // Zip bundle
        const zip = new JSZip();
        images.forEach((img) => {
          zip.file(img.name, img.blob);
        });
        const zipContent = await zip.generateAsync({ type: "blob" });
        saveAs(zipContent, "extracted-images.zip");

        // Chain the zip content if needed (or keep intact)
        setSharedFile(new File([zipContent], "extracted-images.zip", { type: "application/zip" }));
      }
      toast({ title: "Downloaded", description: "Images saved successfully." });
    } catch (error) {
      console.error("ZIP Generation Error:", error);
      toast({
        title: "Download Error",
        description: "Could not package images for download.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setImages([]);
    setIsLoading(false);
    setIsProcessing(false);
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-card border space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Images Found:</span>
          <span className="font-semibold">{images.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Formats:</span>
          <span className="font-semibold text-primary">PNG</span>
        </div>
      </div>

      <Button onClick={handleDownloadAll} disabled={isProcessing || images.length === 0} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {images.length === 1 ? "Download Image" : "Download All (ZIP)"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Extract Embedded Images"
          description="Pull embedded image assets (photos, graphic assets) out of any PDF at their native resolution. Free, 100% private, runs offline."
          optionsPanel={images.length > 0 ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload PDF to extract its original image files"
          >
            {file && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearAll} className="cursor-pointer">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {images.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Extracted Assets
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {images.map((img) => (
                        <Card key={img.id} className="group relative overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors">
                          <CardContent className="p-3 flex flex-col items-center">
                            <div className="relative aspect-square w-full rounded bg-card flex items-center justify-center border overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.dataUrl} alt={img.name} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                              <button
                                onClick={() => saveAs(img.blob, img.name)}
                                className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
                                title="Download image"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="mt-2 text-xs truncate w-full text-center text-muted-foreground font-mono">
                              {img.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {img.width} × {img.height}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
