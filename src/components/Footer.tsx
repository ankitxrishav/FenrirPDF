import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full p-6 text-sm text-muted-foreground">
        <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-4">
          <p className="flex items-center justify-center gap-1.5">
            Made with <Heart className="h-4 w-4 text-red-500" /> by Fenrir
          </p>
          <a href="https://buymeachai.ankushminda.com/fenrirxrishav" target="_blank" rel="noopener noreferrer">
            <img src="https://buymeachai.ankushminda.com/assets/images/buymeachai-button.png" alt="Buy Me A Chai" className="h-10" />
          </a>
        </div>
    </footer>
  );
}
