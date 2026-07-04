"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, pushGraphicsState, popGraphicsState, concatTransformationMatrix } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ThumbnailGrid, GridItem } from "@/components/ThumbnailGrid";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, PlusCircle, Type, Image as ImageIcon } from "lucide-react";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfFile {
  id: string;
  file: File;
  previewUrl: string;
  pageNumber: number;
}

const PdfPreview: React.FC<{
  fileUrl: string | null;
  watermarkType: "text" | "image";
  text: string;
  imagePreview: string | null;
  fontSize: number;
  imageScale: number;
  opacity: number;
  rotation: number;
}> = ({ fileUrl, watermarkType, text, imagePreview, fontSize, imageScale, opacity, rotation }) => {
  if (!fileUrl) {
    return (
      <div className="aspect-[3/4] w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <ImageIcon className="w-16 h-16 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Upload a PDF to see a live preview</p>
      </div>
    );
  }
  return (
    <div className="relative aspect-[3/4] w-full bg-muted rounded-lg overflow-hidden border">
      <img src={fileUrl} alt="PDF Preview" className="w-full h-full object-contain" />
      <div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          transform: `rotate(${rotation}deg)`,
          opacity: opacity,
        }}
      >
        {watermarkType === "text" ? (
          <span
            className="text-black font-bold text-center break-words"
            style={{
              fontSize: `${fontSize}px`,
              color: "rgba(0,0,0,1)",
            }}
          >
            {text}
          </span>
        ) : imagePreview ? (
          <img
            src={imagePreview}
            alt="Watermark"
            className="max-w-full max-h-full"
            style={{
              width: `${imageScale * 100}%`,
              height: "auto",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default function WatermarkPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
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
  const [imageScale, setImageScale] = useState(0.5);

  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (uploadedFiles: File[]) => {
      if (!uploadedFiles || uploadedFiles.length === 0) return;
      setIsLoading(true);
      setProgress(0);

      const largeFiles = uploadedFiles.filter((f) => f.size > 30 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "Large file detected",
          description: "Processing may take longer and use significant memory on this device.",
        });
      }

      const newPdfFiles: PdfFile[] = [];
      let processedFiles = 0;
      const totalFiles = uploadedFiles.length;

      let currentFileNumber = files.length + 1;
      for (const file of uploadedFiles) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid file type",
            description: `Skipped ${file.name} as it's not a PDF.`,
            variant: "destructive",
          });
          continue;
        }

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
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: canvas.toDataURL(),
            pageNumber: currentFileNumber++,
          });
          canvas.width = canvas.height = 0; // free memory
        } catch (error) {
          console.error("Error processing file preview:", error);
          toast({
            title: "Preview Error",
            description: `Could not create a preview for ${file.name}.`,
            variant: "destructive",
          });
        }
        processedFiles++;
        setProgress(Math.round((processedFiles / totalFiles) * 100));
      }
      setFiles((f) => [...f, ...newPdfFiles]);
      setIsLoading(false);
    },
    [toast, files.length]
  );

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("preset_watermark");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.watermarkType) setWatermarkType(config.watermarkType);
        if (config.text) setText(config.text);
        if (config.fontSize) setFontSize(config.fontSize);
        if (config.opacity) setOpacity(config.opacity);
        if (config.rotation !== undefined) setRotation(config.rotation);
        if (config.imageScale) setImageScale(config.imageScale);
      } catch (e) {
        console.error("Error loading watermark preset:", e);
      }
    }
  }, []);

  const handleSavePreset = () => {
    const config = {
      watermarkType,
      text,
      fontSize,
      opacity,
      rotation,
      imageScale,
    };
    localStorage.setItem("preset_watermark", JSON.stringify(config));
    toast({ title: "Preset Saved", description: "Your current watermark settings have been saved as default." });
  };

  // Handle chained file injection
  useEffect(() => {
    if (sharedFile) {
      handleFilesChange([sharedFile]);
      clearSharedFile();
    }
  }, [sharedFile, handleFilesChange, clearSharedFile]);

  const handleDelete = (id: string) => {
    setFiles((currentFiles) => {
      const filtered = currentFiles.filter((f) => f.id !== id);
      return filtered.map((f, idx) => ({ ...f, pageNumber: idx + 1 }));
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload at least one PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      let watermarkAssetBytes: ArrayBuffer | null = null;
      if (watermarkType === "image" && imageFile) {
        watermarkAssetBytes = await imageFile.arrayBuffer();
      }

      if (files.length === 1) {
        // Single file flow
        const pdfFile = files[0];
        const existingPdfBytes = await pdfFile.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        let embeddedAsset: PDFFont | PDFImage | undefined;
        if (watermarkType === "image" && watermarkAssetBytes && imageFile) {
          if (imageFile.type === "image/png") {
            embeddedAsset = await pdfDoc.embedPng(watermarkAssetBytes);
          } else if (imageFile.type === "image/jpeg") {
            embeddedAsset = await pdfDoc.embedJpg(watermarkAssetBytes);
          }
        } else {
          embeddedAsset = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        }

        const pages = pdfDoc.getPages();
        for (const page of pages) {
          const { width, height } = page.getSize();

          if (watermarkType === "text" && embeddedAsset) {
            const font = embeddedAsset as PDFFont;
            const fontScale = 0.96;
            const size = fontSize * fontScale;
            const textWidth = font.widthOfTextAtSize(text, size);
            const textHeight = font.heightAtSize(size);

            const angleRad = (rotation * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const cx = width / 2;
            const cy = height / 2;
            const tx = cx - cos * cx + sin * cy;
            const ty = cy - sin * cx - cos * cy;

            page.pushOperators(
              pushGraphicsState(),
              concatTransformationMatrix(cos, sin, -sin, cos, tx, ty)
            );

            page.drawText(text, {
              x: width / 2 - textWidth / 2,
              y: height / 2 - textHeight / 2,
              size,
              font,
              color: rgb(0, 0, 0),
              opacity,
            });
            page.pushOperators(popGraphicsState());
          } else if (watermarkType === "image" && embeddedAsset) {
            const image = embeddedAsset as PDFImage;
            const scaled = image.scale(imageScale);

            const angleRad = (rotation * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const cx = width / 2;
            const cy = height / 2;
            const tx = cx - cos * cx + sin * cy;
            const ty = cy - sin * cx - cos * cy;

            page.pushOperators(
              pushGraphicsState(),
              concatTransformationMatrix(cos, sin, -sin, cos, tx, ty)
            );

            page.drawImage(image, {
              x: width / 2 - scaled.width / 2,
              y: height / 2 - scaled.height / 2,
              width: scaled.width,
              height: scaled.height,
              opacity: opacity,
            });
            page.pushOperators(popGraphicsState());
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const finalFilename = `watermarked-${pdfFile.file.name}`;
        saveAs(blob, finalFilename);

        // Chain result
        setSharedFile(new File([blob], finalFilename, { type: "application/pdf" }));
      } else {
        // Multi-file ZIP download flow
        const zip = new JSZip();
        let firstFile: File | null = null;

        for (const pdfFile of files) {
          const existingPdfBytes = await pdfFile.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(existingPdfBytes);

          let embeddedAsset: PDFFont | PDFImage | undefined;
          if (watermarkType === "image" && watermarkAssetBytes && imageFile) {
            if (imageFile.type === "image/png") {
              embeddedAsset = await pdfDoc.embedPng(watermarkAssetBytes);
            } else if (imageFile.type === "image/jpeg") {
              embeddedAsset = await pdfDoc.embedJpg(watermarkAssetBytes);
            }
          } else {
            embeddedAsset = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          }

          const pages = pdfDoc.getPages();
          for (const page of pages) {
            const { width, height } = page.getSize();

            if (watermarkType === "text" && embeddedAsset) {
              const font = embeddedAsset as PDFFont;
              const fontScale = 0.96;
              const size = fontSize * fontScale;
              const textWidth = font.widthOfTextAtSize(text, size);
              const textHeight = font.heightAtSize(size);

              const angleRad = (rotation * Math.PI) / 180;
              const cos = Math.cos(angleRad);
              const sin = Math.sin(angleRad);
              const cx = width / 2;
              const cy = height / 2;
              const tx = cx - cos * cx + sin * cy;
              const ty = cy - sin * cx - cos * cy;

              page.pushOperators(
                pushGraphicsState(),
                concatTransformationMatrix(cos, sin, -sin, cos, tx, ty)
              );

              page.drawText(text, {
                x: width / 2 - textWidth / 2,
                y: height / 2 - textHeight / 2,
                size,
                font,
                color: rgb(0, 0, 0),
                opacity,
              });
              page.pushOperators(popGraphicsState());
            } else if (watermarkType === "image" && embeddedAsset) {
              const image = embeddedAsset as PDFImage;
              const scaled = image.scale(imageScale);

              const angleRad = (rotation * Math.PI) / 180;
              const cos = Math.cos(angleRad);
              const sin = Math.sin(angleRad);
              const cx = width / 2;
              const cy = height / 2;
              const tx = cx - cos * cx + sin * cy;
              const ty = cy - sin * cx - cos * cy;

              page.pushOperators(
                pushGraphicsState(),
                concatTransformationMatrix(cos, sin, -sin, cos, tx, ty)
              );

              page.drawImage(image, {
                x: width / 2 - scaled.width / 2,
                y: height / 2 - scaled.height / 2,
                width: scaled.width,
                height: scaled.height,
                opacity: opacity,
              });
              page.pushOperators(popGraphicsState());
            }
          }

          const pdfBytes = await pdfDoc.save();
          const finalFilename = `watermarked-${pdfFile.file.name}`;
          zip.file(finalFilename, pdfBytes);

          if (!firstFile) {
            firstFile = new File([new Blob([pdfBytes], { type: "application/pdf" })], finalFilename, {
              type: "application/pdf",
            });
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "watermarked-pdfs.zip");

        if (firstFile) {
          setSharedFile(firstFile);
        }
      }

      toast({
        title: "Success",
        description: `${files.length} PDF(s) have been watermarked and downloaded.`,
      });
    } catch (error) {
      console.error("Error adding watermark:", error);
      toast({
        title: "Error",
        description: "Could not add watermark to one or more PDFs.",
        variant: "destructive",
      });
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
  };

  const previewUrl = useMemo(() => {
    return files.length > 0 ? files[0].previewUrl : null;
  }, [files]);

  const gridItems: GridItem[] = files.map((f) => ({
    id: f.id,
    title: f.file.name,
    thumbnailUrl: f.previewUrl,
    pageNumber: f.pageNumber,
    subtitle: f.file.name,
  }));

  const optionsPanel = (
    <div className="space-y-6">
      <Tabs value={watermarkType} onValueChange={(v) => setWatermarkType(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="cursor-pointer">
            <Type className="w-4 h-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="cursor-pointer">
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size ({fontSize}px)</Label>
            <Slider
              id="font-size"
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={8}
              max={144}
              step={1}
            />
          </div>
        </TabsContent>
        <TabsContent value="image" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload" className="cursor-pointer">Upload Image (PNG/JPG)</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageFileChange}
              className="cursor-pointer"
            />
          </div>
          {imagePreview && (
            <>
              <div className="border rounded-md p-2 max-h-32 overflow-hidden bg-muted">
                <img src={imagePreview} alt="Watermark preview" className="w-full h-auto object-contain mx-auto" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-scale">Image Scale ({Math.round(imageScale * 100)}%)</Label>
                <Slider
                  id="image-scale"
                  value={[imageScale]}
                  onValueChange={([v]) => setImageScale(v)}
                  min={0.1}
                  max={2}
                  step={0.05}
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-4 pt-6 border-t">
        <div className="space-y-2">
          <Label>Opacity ({Math.round(opacity * 100)}%)</Label>
          <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={0} max={1} step={0.05} />
        </div>
        <div className="space-y-2">
          <Label>Rotation ({rotation}°)</Label>
          <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={-180} max={180} step={5} />
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" onClick={handleSavePreset} className="flex-1 text-xs cursor-pointer">
          Save Preset
        </Button>
      </div>

      <Button onClick={handleDownload} disabled={isProcessing || isLoading || files.length === 0} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Watermark & Download All
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <ToolShell
            title="Add Watermark to PDF"
            description="Stamp a text or image watermark onto your PDF files. Customize the appearance and placement with ease using a live preview."
            optionsPanel={optionsPanel}
          >
            <UploadShell
              filesCount={files.length}
              isLoading={isLoading && files.length === 0}
              progress={progress}
              onFilesChange={handleFilesChange}
              multiple={true}
              description="Upload one or more PDFs to add a watermark"
            >
              {files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  {/* Live Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <PdfPreview
                      fileUrl={previewUrl}
                      watermarkType={watermarkType}
                      text={text}
                      imagePreview={imagePreview}
                      fontSize={fontSize}
                      imageScale={imageScale}
                      opacity={opacity}
                      rotation={rotation}
                    />
                  </div>

                  {/* Thumbnail / File Management */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                      <h3 className="text-lg font-semibold">Files ({files.length})</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => document.getElementById("file-uploader-input")?.click()} className="text-xs cursor-pointer">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Upload More
                        </Button>
                        <input
                          id="file-uploader-input"
                          type="file"
                          multiple
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleFilesChange(Array.from(e.target.files));
                          }}
                        />
                        <Button variant="ghost" size="icon" aria-label="Clear all files" onClick={clearAll} className="cursor-pointer">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <ThumbnailGrid
                      items={gridItems}
                      onItemsOrderChange={() => {}} // Disabled reordering
                      onItemDelete={handleDelete}
                    />

                    <ToolChainingBar />
                  </div>
                </div>
              )}
            </UploadShell>
          </ToolShell>
        </div>
      </main>
    </div>
  );
}
