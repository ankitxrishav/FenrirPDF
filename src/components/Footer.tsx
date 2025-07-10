import { Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-4 px-4">
      <div className="container mx-auto flex h-full flex-col items-center justify-center gap-2 md:flex-row md:justify-between">
        <div className="hidden md:block md:flex-1"></div>

        <div className="flex flex-1 justify-center">
           <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Fenrir
          </p>
        </div>
        
        <div className="flex flex-1 justify-center md:justify-end">
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
