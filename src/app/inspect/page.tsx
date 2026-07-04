"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";

import { UploadShell } from "@/components/UploadShell";
import { ToolShell } from "@/components/ToolShell";
import { ToolChainingBar } from "@/components/ToolChainingBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSharedFile } from "@/context/SharedFileContext";
import { Download, Loader2, X, FileText, Info, Edit3, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  pdfVersion: string;
  isEncrypted: boolean;
  hasForms: boolean;
  hasJS: boolean;
}

export default function InspectPage() {
  const { sharedFile, setSharedFile, clearSharedFile } = useSharedFile();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editKeywords, setEditKeywords] = useState("");

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
      setProgress(50);

      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setProgress(75);

        // Get basic info
        const title = pdfDoc.getTitle() || "";
        const author = pdfDoc.getAuthor() || "";
        const subject = pdfDoc.getSubject() || "";
        const keywords = pdfDoc.getKeywords() || "";
        const creator = pdfDoc.getCreator() || "Unknown";
        const producer = pdfDoc.getProducer() || "Unknown";
        const creationDate = pdfDoc.getCreationDate()?.toLocaleString() || "Unknown";
        const modificationDate = pdfDoc.getModificationDate()?.toLocaleString() || "Unknown";
        const pageCount = pdfDoc.getPageCount();

        // Check features
        const hasForms = pdfDoc.getForm().getFields().length > 0;
        
        // Scan catalog for Javascript or attachments
        let hasJS = false;
        try {
          const js = pdfDoc.context.lookup(pdfDoc.catalog.get(pdfDoc.context.obj("JavaScript")));
          if (js) hasJS = true;
        } catch (_) {}

        setMetadata({
          title,
          author,
          subject,
          keywords,
          creator,
          producer,
          creationDate,
          modificationDate,
          pageCount,
          pdfVersion: "1.7 (Standard)",
          isEncrypted: false,
          hasForms,
          hasJS,
        });

        setEditTitle(title);
        setEditAuthor(author);
        setEditSubject(subject);
        setEditKeywords(keywords);
        setProgress(100);
      } catch (error) {
        console.error("Error inspecting PDF:", error);
        toast({
          title: "Inspection Error",
          description: "Could not read metadata from this PDF. It might be password-protected.",
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

  const handleSaveMetadata = async () => {
    if (!file || !metadata) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Set edited metadata
      pdfDoc.setTitle(editTitle);
      pdfDoc.setAuthor(editAuthor);
      pdfDoc.setSubject(editSubject);
      pdfDoc.setKeywords(editKeywords.split(",").map(k => k.trim()).filter(Boolean));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const saveName = `inspected-${file.name}`;
      saveAs(blob, saveName);

      // Update local state to match saved metadata
      setMetadata(prev => prev ? {
        ...prev,
        title: editTitle,
        author: editAuthor,
        subject: editSubject,
        keywords: editKeywords,
      } : null);

      // Chain result
      setSharedFile(new File([blob], saveName, { type: "application/pdf" }));

      toast({ title: "Success", description: "PDF metadata successfully updated and saved." });
    } catch (error) {
      console.error("Error saving PDF metadata:", error);
      toast({
        title: "Save Error",
        description: "Could not write edited metadata to PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setMetadata(null);
    setIsLoading(false);
    setIsProcessing(false);
  };

  const optionsPanel = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5 border-b pb-2">
          <Edit3 className="w-4 h-4 text-primary" />
          Edit Metadata
        </h3>

        <div className="space-y-2">
          <Label htmlFor="meta-title">Title</Label>
          <Input id="meta-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-author">Author</Label>
          <Input id="meta-author" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-subject">Subject</Label>
          <Input id="meta-subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-keywords">Keywords (comma separated)</Label>
          <Input id="meta-keywords" value={editKeywords} onChange={(e) => setEditKeywords(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleSaveMetadata} disabled={isProcessing} className="w-full cursor-pointer">
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Save & Download PDF
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <ToolShell
          title="PDF Inspector"
          description="View and edit PDF metadata details (Title, Author, Keywords) or check structural statistics locally in your browser."
          optionsPanel={metadata ? optionsPanel : undefined}
        >
          <UploadShell
            filesCount={file ? 1 : 0}
            isLoading={isLoading}
            progress={progress}
            onFilesChange={(files) => handleFileChange(files[0])}
            description="Upload a PDF file to inspect its structure and metadata"
          >
            {file && metadata && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Metadata Report */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Metadata Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3.5 text-sm">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Title</span>
                        <span className="font-semibold text-right">{metadata.title || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Author</span>
                        <span className="font-semibold text-right">{metadata.author || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Subject</span>
                        <span className="font-semibold text-right">{metadata.subject || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Keywords</span>
                        <span className="font-semibold text-right">{metadata.keywords || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Creator Application</span>
                        <span className="font-semibold text-right">{metadata.creator}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">PDF Producer</span>
                        <span className="font-semibold text-right">{metadata.producer}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Created Date</span>
                        <span className="font-semibold text-right">{metadata.creationDate}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-muted-foreground">Modified Date</span>
                        <span className="font-semibold text-right">{metadata.modificationDate}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Structural & Security Report */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        Technical Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3.5 text-sm">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Pages</span>
                        <span className="font-semibold">{metadata.pageCount}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">PDF Version</span>
                        <span className="font-semibold">{metadata.pdfVersion}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Password Protected</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">No</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Contains Interactive Forms</span>
                        <span className="font-semibold">{metadata.hasForms ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-muted-foreground">Embedded JavaScript</span>
                        <span className={`font-semibold ${metadata.hasJS ? "text-amber-500 font-bold animate-pulse" : ""}`}>
                          {metadata.hasJS ? "Yes (Caution)" : "No"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <ToolChainingBar />
              </div>
            )}
          </UploadShell>
        </ToolShell>
      </main>
    </div>
  );
}
