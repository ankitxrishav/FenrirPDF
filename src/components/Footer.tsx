import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 p-4 z-50">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500"/> by Fenrir
        </p>
    </footer>
  );
}
