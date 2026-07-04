"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSharedFile } from "@/context/SharedFileContext";
import { TOOLS } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2 } from "lucide-react";

export const ToolChainingBar: React.FC = () => {
  const { sharedFile } = useSharedFile();
  const router = useRouter();

  if (!sharedFile) return null;

  // Filter out the image-to-pdf tool because it accepts images, not PDFs
  const chainableTools = TOOLS.filter((t) => t.slug !== "image-to-pdf");

  const handleChain = (slug: string) => {
    router.push(`/${slug}`);
  };

  return (
    <div className="mt-8 p-6 rounded-xl border bg-card/50 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Link2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Chain Your Workflow</h4>
            <p className="text-sm text-muted-foreground">
              Directly send <span className="font-semibold text-foreground">{sharedFile.name}</span> to another tool:
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {chainableTools.map((tool) => (
            <Button
              key={tool.slug}
              variant="outline"
              size="sm"
              onClick={() => handleChain(tool.slug)}
              className="text-xs hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 group"
            >
              {tool.title}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
