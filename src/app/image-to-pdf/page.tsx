"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument, PageSizes, rgb, BlendMode } from "pdf-lib";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ThumbnailGrid, GridItem } from "@/components/ThumbnailGrid";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, PlusCircle } from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

// Normalize EXIF orientation by drawing through an <img> element (browser auto-rotates img EXIF)
const normalizeImageOrientation = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          canvas.width = canvas.height = 0; // free memory
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        mimeType,
        0.95
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
};

export default function ImageToPdfPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("converted.pdf");
  const [progress, setProgress] = useState(0);
  const [layout, setLayout] = useState<"1" | "2" | "4">("1");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [invertColors, setInvertColors] = useState(false);

  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (uploadedFiles: File[]) => {
      if (!uploadedFiles || uploadedFiles.length === 0) return;
      setIsLoading(true);
      setProgress(0);

      const readAsDataURL = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const results = await Promise.allSettled(uploadedFiles.map(readAsDataURL));
      const newImages: ImageFile[] = uploadedFiles
        .map((file, i) => {
          const r = results[i];
          if (r.status !== "fulfilled") {
            toast({
              title: "Error reading file",
              description: `Could not read ${file.name}.`,
              variant: "destructive",
            });
            return null;
          }
          return {
            id: `${file.name}-${file.lastModified}-${i}`,
            file,
            previewUrl: r.value,
          };
        })
        .filter(Boolean) as ImageFile[];

      setProgress(100);
      setImages((p) => [...p, ...newImages]);
      setIsLoading(false);
    },
    [toast]
  );

  // Handle chained image files injection if any
  useEffect(() => {
    if (sharedFile && sharedFile.type.startsWith("image/")) {
      handleFilesChange([sharedFile]);
      clearSharedFile();
    }
  }, [sharedFile, handleFilesChange, clearSharedFile]);

  const handleItemsOrderChange = (reorderedItems: any[]) => {
    setImages(reorderedItems);
  };

  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      toast({
        title: "No images to convert",
        description: "Please upload some images.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();
      const imagesPerPage = parseInt(layout, 10);
      const margin = 36;

      const [a4Width, a4Height] = PageSizes.A4;
      const [pageWidth, pageHeight] =
        orientation === "portrait" ? [a4Width, a4Height] : [a4Height, a4Width];

      for (let i = 0; i < images.length; i += imagesPerPage) {
        const page = newPdf.addPage([pageWidth, pageHeight]);
        const imageChunk = images.slice(i, i + imagesPerPage);

        let positions: { x: number; y: number; width: number; height: number }[] = [];

        if (imagesPerPage === 1) {
          positions = [
            { x: margin, y: margin, width: pageWidth - margin * 2, height: pageHeight - margin * 2 },
          ];
        } else if (imagesPerPage === 2) {
          const h = (pageHeight - margin * 3) / 2;
          positions = [
            { x: margin, y: margin + h + margin, width: pageWidth - margin * 2, height: h },
            { x: margin, y: margin, width: pageWidth - margin * 2, height: h },
          ];
        } else if (imagesPerPage === 4) {
          const w = (pageWidth - margin * 3) / 2;
          const h = (pageHeight - margin * 3) / 2;
          positions = [
            { x: margin, y: margin + h + margin, width: w, height: h }, // Top-left
            { x: margin + w + margin, y: margin + h + margin, width: w, height: h }, // Top-right
            { x: margin, y: margin, width: w, height: h }, // Bottom-left
            { x: margin + w + margin, y: margin, width: w, height: h }, // Bottom-right
          ];
        }

        for (let j = 0; j < imageChunk.length; j++) {
          const imageFile = imageChunk[j];
          const normalizedBlob = await normalizeImageOrientation(imageFile.file);
          const imageBytes = await normalizedBlob.arrayBuffer();
          let embeddedImage;
          if (imageFile.file.type === "image/png") {
            embeddedImage = await newPdf.embedPng(imageBytes);
          } else {
            embeddedImage = await newPdf.embedJpg(imageBytes);
          }

          const pos = positions[j];
          const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);
          const scale = Math.min(pos.width / imgWidth, pos.height / imgHeight);
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          page.drawImage(embeddedImage, {
            x: pos.x + (pos.width - scaledWidth) / 2,
            y: pos.y + (pos.height - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
          });
        }
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
            opacity: 1,
            blendMode: BlendMode.Difference,
          });
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalFilename = filename;
      saveAs(blob, finalFilename);

      // Chain result
      setSharedFile(new File([blob], finalFilename, { type: "application/pdf" }));

      toast({ title: "Success", description: "Images successfully converted to PDF." });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({
        title: "Conversion Error",
        description: "Could not create the PDF document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setIsProcessing(false);
    setIsLoading(false);
    toast({ title: "Cleared", description: "All images have been removed." });
  };

  const gridItems: GridItem[] = images.map((img, idx) => ({
    id: img.id,
    title: img.file.name,
    thumbnailUrl: img.previewUrl,
    pageNumber: idx + 1,
    subtitle: img.file.name,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Layout (Images per Page)</Label>
        <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
          <SelectTrigger className="cursor-pointer">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Image per Page</SelectItem>
            <SelectItem value="2">2 Images per Page</SelectItem>
            <SelectItem value="4">4 Images per Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Page Orientation</Label>
        <RadioGroup value={orientation} onValueChange={(v: any) => setOrientation(v)} className="flex gap-4 pt-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="portrait" id="opt-portrait" className="cursor-pointer" />
            <Label htmlFor="opt-portrait" className="cursor-pointer">Portrait</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="landscape" id="opt-landscape" className="cursor-pointer" />
            <Label htmlFor="opt-landscape" className="cursor-pointer">Landscape</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="invert-colors"
          checked={invertColors}
          onCheckedChange={(checked) => setInvertColors(!!checked)}
          className="cursor-pointer"
        />
        <Label htmlFor="invert-colors" className="text-sm font-medium cursor-pointer">
          Invert Colors (Difference Mode)
        </Label>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="filename">Output Filename</Label>
        <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>

      <Button onClick={handleConvert} disabled={isProcessing || images.length === 0} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Convert to PDF
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <ToolShell
            title="Image to PDF"
            description="Convert your JPG, JPEG, and PNG images into a single PDF file. Drag and drop to reorder images before generating."
            optionsPanel={images.length > 0 ? optionsPanel : undefined}
          >
            <UploadShell
              filesCount={images.length}
              isLoading={isLoading && images.length === 0}
              progress={progress}
              onFilesChange={handleFilesChange}
              multiple={true}
              accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
              description="Select multiple images to convert them to PDF"
            >
              {images.length > 0 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold">Your Images ({images.length})</h2>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById("file-uploader-input")?.click()} className="text-xs cursor-pointer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Upload More
                      </Button>
                      <input
                        id="file-uploader-input"
                        type="file"
                        multiple
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) handleFilesChange(Array.from(e.target.files));
                        }}
                      />
                      <Button variant="ghost" size="icon" aria-label="Clear all images" onClick={clearAll} className="cursor-pointer">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Drag and drop images to set their order in the converted PDF.
                  </p>

                  <ThumbnailGrid
                    items={gridItems}
                    onItemsOrderChange={handleItemsOrderChange}
                    onItemDelete={deleteImage}
                    aspectRatioClass="aspect-square"
                  />

                  <ToolChainingBar />
                </div>
              )}
            </UploadShell>
          </ToolShell>
        </div>
      </main>
    </div>
  );
}
