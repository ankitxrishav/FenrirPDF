
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { saveAs } from "file-saver";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Loader2,
  X,
  ShieldAlert,
  FileUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { convertToPdf, type ConvertToPdfInput } from "@/ai/flows/convertToPdf";

interface FileWithPreview extends File {
  preview: string;
}


const acceptedFileTypes = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/msword': ['.doc'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

// Helper function to read a file as a Data URI
const readFileAsDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ConvertPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleFilesChange = useCallback(
    async (acceptedFiles: File[]) => {
       setFiles(prevFiles => [
        ...prevFiles,
        ...acceptedFiles.map(file => Object.assign(file, {
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        }))
      ]);
    },
    []
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesChange(acceptedFiles);
  }, [handleFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
  });

  const removeFile = (fileName: string) => {
    setFiles(files => files.filter(file => file.name !== fileName));
  };
  
  const clearAll = () => {
    setFiles([]);
    setIsConverting(false);
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to convert",
        description: "Please upload at least one file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsConverting(true);
    toast({ title: "Starting Conversion", description: "Your files are being uploaded and converted..." });
    
    try {
      const fileInputs = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          dataUri: await readFileAsDataURI(file),
        }))
      );

      const input: ConvertToPdfInput = { files: fileInputs };
      const result = await convertToPdf(input);

      // Convert data URI back to a blob for download
      const res = await fetch(result.pdfDataUri);
      const blob = await res.blob();
      saveAs(blob, "converted.pdf");
      
      toast({ title: "Conversion Successful", description: "Your PDF has been downloaded." });
    } catch (error) {
      console.error("Conversion failed:", error);
      toast({
        title: "Conversion Failed",
        description: "An error occurred while converting your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleFileUploadClick = () => {
    const el = document.getElementById('file-upload-input');
    if (el) {
      el.click();
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Convert Files to PDF</h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
                Upload your DOCX, PPTX, XLSX, and image files to convert them all into a single PDF document.
            </p>
        </div>

        <Alert variant="destructive" className="mb-8 bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
            <AlertTitle>Privacy Notice: Server-Side Processing</AlertTitle>
            <AlertDescription>
                To convert your files, they will be securely uploaded to our server. We do not store your files; they are processed and deleted immediately after conversion. Our other tools (Merge & Extract) remain 100% private and in-browser.
            </AlertDescription>
        </Alert>
        
        {files.length === 0 ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[40vh] cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
            onClick={(e) => e.preventDefault()}
          >
            <input {...getInputProps()} id="file-upload-input" />
            <UploadCloud className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">
               Drag &amp; Drop or <span className="text-accent underline" onClick={handleFileUploadClick}>Click to Upload</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Supports DOCX, PPTX, XLSX, JPG, PNG, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-card border">
                <h2 className="text-xl font-semibold">Your Files ({files.length})</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <Button onClick={handleConvert} disabled={isConverting}>
                    {isConverting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Convert & Download
                  </Button>
                  <Button variant="outline" onClick={handleFileUploadClick} disabled={isConverting}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Add More Files
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll}><X className="h-4 w-4"/></Button>
                </div>
            </div>
            
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {files.map(file => (
                  <Card key={file.name} className="relative group overflow-hidden shadow-md">
                    <CardContent className="p-0 aspect-square flex items-center justify-center bg-muted">
                      {file.type.startsWith('image/') ? (
                         <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      )}
                    </CardContent>
                     <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeFile(file.name)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center p-1 truncate">
                        {file.name}
                    </div>
                  </Card>
                ))}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
