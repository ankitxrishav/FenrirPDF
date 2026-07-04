"use client";

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

import { ToolShell } from "@/components/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, FileText, ArrowRightLeft, BookOpen, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

interface DiffToken {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export default function ComparePage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffToken[] | null>(null);
  const [stats, setStats] = useState({ additions: 0, deletions: 0, unchanged: 0 });

  const { toast } = useToast();

  const handleUploadA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      if (uploaded.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
        return;
      }
      setFileA(uploaded);
      setDiffResult(null);
    }
  };

  const handleUploadB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      if (uploaded.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
        return;
      }
      setFileB(uploaded);
      setDiffResult(null);
    }
  };

  const extractText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const computeWordDiff = (text1: string, text2: string) => {
    const words1 = text1.split(/\s+/).filter(Boolean);
    const words2 = text2.split(/\s+/).filter(Boolean);

    const n = words1.length;
    const m = words2.length;

    // LCS-based diff implementation
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const tokens: DiffToken[] = [];
    let i = n, j = m;
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
        tokens.unshift({ type: "unchanged", text: words1[i - 1] });
        unchanged++;
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        tokens.unshift({ type: "added", text: words2[j - 1] });
        additions++;
        j--;
      } else {
        tokens.unshift({ type: "removed", text: words1[i - 1] });
        deletions++;
        i--;
      }
    }

    setStats({ additions, deletions, unchanged });
    setDiffResult(tokens);
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;

    setIsLoading(true);
    try {
      const textA = await extractText(fileA);
      const textB = await extractText(fileB);

      // Protect against extremely large payloads that might hang the main thread
      if (textA.length > 250000 || textB.length > 250000) {
        toast({
          title: "Files too large",
          description: "This text diff handles files up to ~250k characters. Please use smaller files.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      computeWordDiff(textA, textB);
      toast({ title: "Comparison Complete", description: "View the text differences below." });
    } catch (error) {
      console.error("Diff Error:", error);
      toast({
        title: "Comparison Failed",
        description: "An error occurred while comparing the files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setFileA(null);
    setFileB(null);
    setDiffResult(null);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl">
        <ToolShell
          title="Compare PDF Text"
          description="Upload two versions of a PDF document to compare their text contents. Added and removed words are highlighted instantly in your browser."
        >
          <div className="space-y-8">
            {/* Dual Upload Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document A (Original) */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card transition-all relative">
                {fileA ? (
                  <div className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="max-w-[200px] sm:max-w-xs">
                        <p className="font-semibold truncate text-sm">{fileA.name}</p>
                        <p className="text-[10px] text-muted-foreground">Original Document (A)</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFileA(null)} className="cursor-pointer">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Label htmlFor="upload-a" className="cursor-pointer font-semibold text-primary hover:underline">
                      Upload Original PDF (A)
                    </Label>
                    <input id="upload-a" type="file" accept="application/pdf" className="hidden" onChange={handleUploadA} />
                    <p className="text-xs text-muted-foreground mt-1">Select the reference document</p>
                  </div>
                )}
              </div>

              {/* Document B (Modified) */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card transition-all relative">
                {fileB ? (
                  <div className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="max-w-[200px] sm:max-w-xs">
                        <p className="font-semibold truncate text-sm">{fileB.name}</p>
                        <p className="text-[10px] text-muted-foreground">Modified Document (B)</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFileB(null)} className="cursor-pointer">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                    <Label htmlFor="upload-b" className="cursor-pointer font-semibold text-primary hover:underline">
                      Upload Modified PDF (B)
                    </Label>
                    <input id="upload-b" type="file" accept="application/pdf" className="hidden" onChange={handleUploadB} />
                    <p className="text-xs text-muted-foreground mt-1">Select the updated document</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compare Action Button */}
            {fileA && fileB && !diffResult && (
              <div className="flex justify-center">
                <Button onClick={handleCompare} disabled={isLoading} className="cursor-pointer px-8 py-6 text-base">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="mr-2 h-5 w-5" />
                  )}
                  Compare Documents
                </Button>
              </div>
            )}

            {/* Diff Results display */}
            {diffResult && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-green-500/5 border-green-500/20 text-center">
                    <CardHeader className="p-3">
                      <CardTitle className="text-xs font-semibold text-green-600 dark:text-green-400">Words Added</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{stats.additions}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/5 border-red-500/20 text-center">
                    <CardHeader className="p-3">
                      <CardTitle className="text-xs font-semibold text-red-600 dark:text-red-400">Words Removed</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{stats.deletions}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50 border text-center">
                    <CardHeader className="p-3">
                      <CardTitle className="text-xs font-semibold text-muted-foreground">Unchanged Words</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-2xl font-bold text-foreground">{stats.unchanged}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Diff Viewer Text Panel */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-3.5">
                    <CardTitle className="text-base font-semibold">Differences Report</CardTitle>
                    <Button variant="outline" size="sm" onClick={clearAll} className="cursor-pointer text-xs">
                      Clear Comparison
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-lg border bg-muted/20">
                      {diffResult.map((tok, idx) => {
                        if (tok.type === "added") {
                          return (
                            <span key={idx} className="bg-green-500/20 text-green-700 dark:text-green-400 px-1 rounded font-bold mx-0.5">
                              {tok.text}
                            </span>
                          );
                        } else if (tok.type === "removed") {
                          return (
                            <span key={idx} className="bg-red-500/20 text-red-700 dark:text-red-400 line-through px-0.5 rounded mx-0.5">
                              {tok.text}
                            </span>
                          );
                        } else {
                          return <span key={idx} className="mx-0.5">{tok.text}</span>;
                        }
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ToolShell>
      </main>
    </div>
  );
}
