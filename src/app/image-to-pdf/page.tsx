
"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument, PageSizes, rgb, BlendMode } from "pdf-lib";
import { saveAs } from "file-saver";
import { useDropzone } from "react-dropzone";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Loader2,
  X,
  PlusCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface SortableImageThumbnailProps {
  image: ImageFile;
  onDelete: (id: string) => void;
  index: number;
}

const SortableImageThumbnail: React.FC<SortableImageThumbnailProps> = ({ image, onDelete, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`relative group overflow-hidden transition-all duration-300 ${
          isDragging ? "shadow-2xl scale-105" : "shadow-md"
        }`}
      >
        <CardContent
          className="p-0 aspect-square flex items-center justify-center bg-muted"
          {...listeners}
        >
          <img
            src={image.previewUrl}
            alt={`Preview of ${image.file.name}`}
            className="w-full h-full object-cover"
          />
        </CardContent>
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
          {index + 1}
        </div>
      </Card>
    </div>
  );
};

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filename, setFilename] = useState("converted.pdf");
  const [progress, setProgress] = useState(0);
  const [layout, setLayout] = useState<"1" | "2" | "4">("1");
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [invertColors, setInvertColors] = useState(false);

  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (uploadedFiles: File[]) => {
      if (!uploadedFiles || uploadedFiles.length === 0) return;
      setIsLoading(true);
      setProgress(0);
      
      const newImages: ImageFile[] = [];
      let loadedCount = 0;

      for (const file of uploadedFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: e.target?.result as string
          });
          loadedCount++;
          setProgress(Math.round((loadedCount / uploadedFiles.length) * 100));
          if (loadedCount === uploadedFiles.length) {
            setImages(p => [...p, ...newImages]);
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          toast({ title: "Error reading file", description: `Could not read ${file.name}.`, variant: "destructive" });
          loadedCount++;
           if (loadedCount === uploadedFiles.length) {
            setImages(p => [...p, ...newImages]);
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [toast]
  );
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, [handleFilesChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
  });
  
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      toast({ title: "No images to convert", description: "Please upload some images.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();
      const imagesPerPage = parseInt(layout, 10);
      const margin = 36;
      
      const [a4Width, a4Height] = PageSizes.A4;
      const [pageWidth, pageHeight] = orientation === 'portrait' ? [a4Width, a4Height] : [a4Height, a4Width];

      for (let i = 0; i < images.length; i += imagesPerPage) {
        const page = newPdf.addPage([pageWidth, pageHeight]);
        const imageChunk = images.slice(i, i + imagesPerPage);
        
        let positions: {x: number, y: number, width: number, height: number}[] = [];

        if (imagesPerPage === 1) {
            positions = [{ x: margin, y: margin, width: pageWidth - margin * 2, height: pageHeight - margin * 2 }];
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
            const imageBytes = await imageFile.file.arrayBuffer();
            let embeddedImage;
            if(imageFile.file.type === 'image/png') {
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
                    blendMode: BlendMode.Difference,
                });
            }
        }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, filename);
    } catch (error) {
      console.error("Error creating PDF from images:", error);
      toast({ title: "Conversion Error", description: "Could not create the PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const clearAll = () => {
    setImages([]);
    setIsProcessing(false);
    setIsLoading(false);
    setProgress(0);
    toast({ title: "Cleared", description: "All images have been removed." });
  };
  
  const imageIds = useMemo(() => images.map((p) => p.id), [images]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Convert Images to PDF</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
                Upload your JPG or PNG images, drag to reorder, choose a layout, and create a professional PDF in seconds.
            </p>
        </div>
        {images.length === 0 && !isLoading ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
               Drag &amp; Drop or <button type="button" className="text-accent underline" onClick={open}>Click to Upload</button>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Select multiple JPG or PNG files
            </p>
          </div>
        ) : isLoading && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-full max-w-md space-y-4">
                <p className="text-lg text-center text-muted-foreground">
                  Loading images...
                </p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                <div className="flex items-center flex-wrap gap-4">
                  <h2 className="text-xl font-semibold">Your Images ({images.length})</h2>
                   <div className="w-48">
                    <Select value={layout} onValueChange={(v) => setLayout(v as any)}>
                        <SelectTrigger><SelectValue placeholder="Select layout" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Image per page</SelectItem>
                            <SelectItem value="2">2 Images per page</SelectItem>
                            <SelectItem value="4">4 Images per page</SelectItem>
                        </SelectContent>
                    </Select>
                   </div>
                   <div className="w-48">
                    <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
                        <SelectTrigger><SelectValue placeholder="Select orientation" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                    </Select>
                   </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="invert-colors" checked={invertColors} onCheckedChange={(checked) => setInvertColors(!!checked)} />
                        <Label htmlFor="invert-colors">Invert Colors</Label>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button onClick={handleConvert} disabled={isProcessing || isLoading}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Convert & Download
                  </Button>
                  <Button variant="outline" onClick={open} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload More
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">Drag and drop images to reorder them for the final PDF.</p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={imageIds}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {images.map((image, index) => (
                    <SortableImageThumbnail
                      key={image.id}
                      image={image}
                      onDelete={deleteImage}
                      index={index}
                    />
                  ))}
                   {isLoading && (
                      <div className="flex flex-col items-center justify-center aspect-square p-4 border border-dashed rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <p className="mt-2 text-sm text-center text-muted-foreground">Loading...</p>
                      </div>
                    )}
                </div>
              </SortableContext>
            </DndContext>
            
            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-md">
                <Label htmlFor="filename">Output Filename</Label>
                <Input id="filename" value={filename} onChange={e => setFilename(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
