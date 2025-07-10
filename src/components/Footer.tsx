import { Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between h-full">
        {/* Centered Text for Desktop, centered in column for mobile */}
        <div className="w-full flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 pointer-events-none">
           <p className="flex items-center gap-1.5 text-sm text-muted-foreground pointer-events-auto">
            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Fenrir
          </p>
        </div>
        
        {/* Button: Centered on mobile, right on desktop */}
        <div className="mt-2 md:mt-0 md:ml-auto">
          <Button asChild variant="outline" size="sm">
              <Link href="https://buymeachai.ankushminda.com/fenrirxrishav" target="_blank" rel="noopener noreferrer">
                  <Coffee className="mr-2 h-4 w-4" />
                  Buy me a chai
              </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
