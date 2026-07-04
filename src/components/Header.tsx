"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronDown, Layers, FileImage, Edit3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TOOLS } from "@/lib/tools";

export function Header() {
  const organizeTools = TOOLS.filter((t) =>
    ["merge", "extract", "rotate", "four-in-one"].includes(t.slug)
  );
  const convertTools = TOOLS.filter((t) =>
    ["image-to-pdf"].includes(t.slug)
  );
  const editTools = TOOLS.filter((t) =>
    ["watermark", "number", "invert"].includes(t.slug)
  );

  return (
    <header className="w-full p-4 relative z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-90 transition-opacity"
          >
            <Image src="/iconF.svg" alt="FenrirPDF Logo" width={28} height={28} />
            <span className="font-headline tracking-tight text-foreground">fenrirPDF</span>
          </Link>

          {/* Tools Dropdown Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none select-none">
              Tools
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2" align="start">
              {/* Organize */}
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1">
                <Layers className="w-3.5 h-3.5" />
                Organize
              </DropdownMenuLabel>
              {organizeTools.map((t) => (
                <DropdownMenuItem key={t.slug} asChild>
                  <Link href={`/${t.slug}`} className="w-full cursor-pointer px-2 py-1.5 text-sm">
                    {t.title}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              {/* Convert */}
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1">
                <FileImage className="w-3.5 h-3.5" />
                Convert
              </DropdownMenuLabel>
              {convertTools.map((t) => (
                <DropdownMenuItem key={t.slug} asChild>
                  <Link href={`/${t.slug}`} className="w-full cursor-pointer px-2 py-1.5 text-sm">
                    {t.title}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              {/* Edit */}
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1">
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </DropdownMenuLabel>
              {editTools.map((t) => (
                <DropdownMenuItem key={t.slug} asChild>
                  <Link href={`/${t.slug}`} className="w-full cursor-pointer px-2 py-1.5 text-sm">
                    {t.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
