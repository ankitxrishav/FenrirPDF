"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  History,
  Layers,
  FileImage,
  Edit3,
  Merge,
  Scissors,
  Baseline,
  Droplet,
  Grid,
  RefreshCcw,
  Image as ImageIcon,
  RotateCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TOOLS, Tool } from "@/lib/tools";

const iconMap: Record<string, React.ComponentType<any>> = {
  Grid,
  RefreshCcw,
  Image: ImageIcon,
  Merge,
  Scissors,
  Baseline,
  Droplet,
  RotateCw,
};

const FeatureCard = ({ tool, onSelect }: { tool: Tool; onSelect: () => void }) => {
  const IconComponent = iconMap[tool.iconName] || Layers;

  return (
    <Link href={`/${tool.slug}`} onClick={onSelect} className="w-full">
      <div className="h-full bg-card hover:bg-accent/5 p-6 rounded-2xl flex flex-col items-center text-center w-full border hover:border-primary/50 hover:shadow-lg hover:scale-[1.03] transition-all duration-300 group">
        <div className="bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-full p-4 transition-all duration-300 shadow-sm">
          <IconComponent size={28} />
        </div>
        <h3 className="mt-4 font-bold text-foreground text-lg group-hover:text-primary transition-colors">
          {tool.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {tool.description}
        </p>
      </div>
    </Link>
  );
};

export default function HomeDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Load session-only recent tools
    const recents = sessionStorage.getItem("recent_tools");
    if (recents) {
      try {
        setRecentSlugs(JSON.parse(recents));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSelectTool = (slug: string) => {
    const nextRecents = [slug, ...recentSlugs.filter((s) => s !== slug)].slice(0, 4);
    setRecentSlugs(nextRecents);
    sessionStorage.setItem("recent_tools", JSON.stringify(nextRecents));
  };

  const filteredTools = TOOLS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const organizeTools = filteredTools.filter((t) =>
    ["merge", "extract", "rotate", "four-in-one"].includes(t.slug)
  );
  const convertTools = filteredTools.filter((t) =>
    ["image-to-pdf"].includes(t.slug)
  );
  const editTools = filteredTools.filter((t) =>
    ["watermark", "number", "invert"].includes(t.slug)
  );
  const recentTools = TOOLS.filter((t) => recentSlugs.includes(t.slug));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Search Section */}
      <div className="w-full max-w-md mx-auto relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
        <Input
          type="search"
          placeholder="Search tools... (e.g. merge, rotate)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-card border-muted-foreground/20 rounded-xl focus-visible:ring-primary shadow-sm"
        />
      </div>

      {/* Recent Tools */}
      {recentTools.length > 0 && searchQuery === "" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="w-4 h-4" />
            Recent Tools
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentTools.map((tool) => {
              const Icon = iconMap[tool.iconName] || Layers;
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  onClick={() => handleSelectTool(tool.slug)}
                  className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:border-primary/50 hover:bg-accent/5 transition-all shadow-sm group"
                >
                  <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Icon size={18} />
                  </div>
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid divided by categories */}
      <div className="space-y-10">
        {/* Category: Organize */}
        {organizeTools.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Layers className="w-5 h-5 text-primary" />
              Organize PDF
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {organizeTools.map((tool) => (
                <FeatureCard
                  key={tool.slug}
                  tool={tool}
                  onSelect={() => handleSelectTool(tool.slug)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category: Convert */}
        {convertTools.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileImage className="w-5 h-5 text-primary" />
              Convert
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {convertTools.map((tool) => (
                <FeatureCard
                  key={tool.slug}
                  tool={tool}
                  onSelect={() => handleSelectTool(tool.slug)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category: Edit */}
        {editTools.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit PDF
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {editTools.map((tool) => (
                <FeatureCard
                  key={tool.slug}
                  tool={tool}
                  onSelect={() => handleSelectTool(tool.slug)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredTools.length === 0 && (
          <div className="text-center py-12 bg-card border rounded-2xl shadow-sm">
            <p className="text-muted-foreground font-medium">No tools match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
