import { Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Footer() {
  return (
    <>
      {/* Centered Text */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50 pointer-events-none">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Fenrir
        </p>
      </div>
      
      {/* Button on the right */}
      <footer className="fixed bottom-4 right-4 z-50">
         <Button asChild variant="outline" size="sm">
            <Link href="https://buymeachai.ankushminda.com/fenrirxrishav" target="_blank" rel="noopener noreferrer">
                <Coffee className="mr-2 h-4 w-4" />
                Buy me a chai
            </Link>
        </Button>
      </footer>
    </>
  );
}
