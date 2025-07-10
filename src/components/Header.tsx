import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { FileType } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-8 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <FileType className="h-6 w-6 text-accent" />
          <span className="font-headline">fenrirPDF</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
