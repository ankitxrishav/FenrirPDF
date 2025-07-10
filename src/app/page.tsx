import Link from 'next/link';
import { Coffee, Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

const MergeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 2H12C10.9 2 10.01 2.9 10.01 4L10 38C10 39.1 10.9 40 12 40H30C31.1 40 32 39.1 32 38V4C32 2.9 31.1 2 30 2ZM28 32H24V28H20V32H16V20H28V32Z" fill="currentColor"/>
      <path d="M36 8H34V42C34 43.1 33.1 44 32 44H14V46H32C34.21 46 36 44.21 36 42V8Z" fill="currentColor" className="opacity-70"/>
    </svg>
);

const ExtractIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 2H12C9.79 2 8 3.79 8 6V42C8 44.21 9.79 46 12 46H36C38.21 46 40 44.21 40 42V10L32 2ZM28 28H16V24H28V28ZM28 20H16V16H28V20ZM30 12V4H38L30 12Z" fill="currentColor"/>
    </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 dark:bg-gray-900 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto bg-white/30 dark:bg-black/20 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-gray-300/20 dark:shadow-black/20 overflow-hidden animated-border">
            <div className="p-10 md:p-16">
                <div className="mb-12 text-center md:text-left">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                    Merge. Extract. Done.
                  </h1>
                  <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    Your everyday PDF tool – lightweight, fast, no signup.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Link href="/merge">
                    <div className="text-primary dark:text-accent-foreground/80 bg-white/50 dark:bg-white/10 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <MergeIcon />
                      <p className="mt-4 font-bold text-xl text-gray-800 dark:text-white">Merge PDFs</p>
                    </div>
                  </Link>
                  <Link href="/extract">
                    <div className="text-primary dark:text-accent-foreground/80 bg-white/50 dark:bg-white/10 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <ExtractIcon />
                      <p className="mt-4 font-bold text-xl text-gray-800 dark:text-white">Extract & Reorder</p>
                    </div>
                  </Link>
                </div>
                
                <p className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    All processing is done locally in your browser.
                </p>
            </div>
        </div>
      </main>
      <footer className="w-full p-6 text-sm text-muted-foreground relative">
          <div className="container mx-auto flex justify-center items-center">
            <p className="flex items-center justify-center gap-1.5">
              Made with <Heart className="h-4 w-4 text-red-500" /> by Fenrir
            </p>
          </div>
        <div className="absolute bottom-6 right-6">
            <a href="https://buymeacoffee.com/fenrirxankit" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="rounded-full hover:bg-white/20 transition-transform duration-200 hover:scale-110 h-14 w-auto px-4 gap-2">
                  <Coffee className="h-7 w-7 text-primary" />
                  <span className="text-primary font-semibold hidden sm:inline">Buy me a coffee</span>
              </Button>
            </a>
        </div>
      </footer>
    </div>
  );
}
