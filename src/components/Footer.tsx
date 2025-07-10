import { Heart } from 'lucide-react';

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
      <footer className="fixed bottom-0 right-0 p-4 z-50">
        <a href="https://buymeachai.ankushminda.com/fenrirxrishav" target="_blank" rel="noopener noreferrer">
            <img src="https://buymeachai.ankushminda.com/assets/images/buymeachai-button.png" alt="Buy Me A Chai" width="200" />
        </a>
      </footer>
    </>
  );
}