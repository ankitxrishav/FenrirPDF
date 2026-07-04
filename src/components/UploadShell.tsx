"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadShellProps {
  filesCount: number;
  isLoading: boolean;
  progress: number;
  loadingMessage?: string;
  onFilesChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  description?: string;
  children: React.ReactNode;
}

export const UploadShell: React.FC<UploadShellProps> = ({
  filesCount,
  isLoading,
  progress,
  loadingMessage = "Processing your files...",
  onFilesChange,
  accept = { "application/pdf": [".pdf"] },
  multiple = false,
  description = "Upload a PDF file to get started",
  children,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesChange(acceptedFiles);
      }
    },
    [onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple,
    noClick: true,
    noKeyboard: true,
    accept,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] border rounded-lg bg-card shadow-sm p-8">
        <div className="w-full max-w-md space-y-4">
          <p className="text-lg font-medium text-center text-foreground">
            {loadingMessage}
          </p>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-center text-muted-foreground">{progress}%</p>
        </div>
      </div>
    );
  }

  if (filesCount === 0) {
    return (
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-[50vh] transition-all duration-300 ${
          isDragActive
            ? "border-primary bg-primary/10 scale-[0.99] shadow-inner"
            : "border-muted-foreground/30 hover:border-primary/50 bg-card hover:bg-accent/5"
        }`}
      >
        <input {...getInputProps()} />
        <div className="p-4 rounded-full bg-primary/5 mb-4 text-primary">
          <UploadCloud className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Drag &amp; Drop or{" "}
          <button
            type="button"
            className="text-primary hover:underline font-semibold"
            onClick={open}
          >
            Click to Upload
          </button>
        </h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      </div>
    );
  }

  // When files are already uploaded, we render children.
  // The dropzone wrapping can still detect files dragged over the layout if needed.
  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-background px-6 py-4 rounded-lg shadow-lg flex flex-col items-center gap-2">
            <UploadCloud className="w-8 h-8 text-primary animate-bounce" />
            <p className="font-semibold text-sm">Drop files here to upload</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
