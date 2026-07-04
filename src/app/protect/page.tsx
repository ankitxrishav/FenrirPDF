"use client";

import React, { useState, useCallback, useEffect } from "react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, Lock, ShieldAlert, KeyRound } from "lucide-react";

export default function ProtectPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [password, setPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [filename, setFilename] = useState("protected.pdf");

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
      setFilename(`protected-${uploadedFile.name}`);
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

  const handleEncrypt = async () => {
    if (!file) return;

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password to encrypt your PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(50);

      // Perform client-side encryption using pdf-encrypt-lite
      const encryptedBytes = await encryptPDF(
        new Uint8Array(arrayBuffer),
        password,
        ownerPassword || undefined
      );
      setProgress(80);

      const blob = new Blob([encryptedBytes], { type: "application/pdf" });
      saveAs(blob, filename);

      // Chain output
      setSharedFile(new File([blob], filename, { type: "application/pdf" }));

      toast({
        title: "PDF Protected",
        description: "Your PDF is now encrypted with password protection.",
      });
      setProgress(100);
    } catch (error) {
      console.error("Encryption Error:", error);
      toast({
        title: "Encryption Failed",
        description: "An error occurred while encrypting the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPassword("");
    setOwnerPassword("");
    setIsProcessing(false);
    setProgress(0);
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5 border-b pb-2">
          <KeyRound className="w-4 h-4 text-primary" />
          Security Settings
        </h3>

        <div className="space-y-2">
          <Label htmlFor="pdf-password">User Password (to open)</Label>
          <Input
            id="pdf-password"
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            This password will be required to open the PDF.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-owner-password">Owner Password (optional)</Label>
          <Input
            id="pdf-owner-password"
            type="password"
            placeholder="Enter owner password..."
            value={ownerPassword}
            onChange={(e) => setOwnerPassword(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            Allows restricting document modifications.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="filename">Output Filename</Label>
          <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleEncrypt} disabled={isProcessing || !password} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        Encrypt PDF
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="Protect PDF with Password"
          description="Secure your PDF document by encrypting it with a password. Uses standard RC4 128-bit encryption completely inside your browser so your document never leaves your machine."
          optionsPanel={file ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload PDF to encrypt with password protection"
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
                  {!isProcessing && (
                    <Button variant="ghost" size="icon" onClick={clearAll} className="cursor-pointer">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isProcessing && (
                  <div className="p-6 rounded-lg bg-muted border space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Encrypting PDF file...</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {!isProcessing && (
                  <div className="flex gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <p>
                      <strong>100% Client-Side:</strong> All password processing and file encryption runs locally in your browser. No files or passwords are sent to any server.
                    </p>
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
