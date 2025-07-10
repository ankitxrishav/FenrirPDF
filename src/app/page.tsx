import Link from 'next/link';
import { Coffee } from 'lucide-react';

const MergeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 2H12C10.9 2 10.01 2.9 10.01 4L10 38C10 39.1 10.9 40 12 40H30C31.1 40 32 39.1 32 38V4C32 2.9 31.1 2 30 2ZM28 32H24V28H20V32H16V20H28V32Z" fill="#8A9BFF"/>
      <path d="M36 8H34V42C34 43.1 33.1 44 32 44H14V46H32C34.21 46 36 44.21 36 42V8Z" fill="#6C7BFF"/>
    </svg>
);

const ExtractIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 2H12C9.79 2 8 3.79 8 6V42C8 44.21 9.79 46 12 46H36C38.21 46 40 44.21 40 42V10L32 2ZM28 28H16V24H28V28ZM28 20H16V16H28V20ZM30 12V4H38L30 12Z" fill="#8A9BFF"/>
    </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-black/30 rounded-3xl shadow-2xl shadow-gray-300/20 dark:shadow-black/20 overflow-hidden">
            <div className="p-8 md:p-12">
                <header className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M64 0C28.6533 0 0 28.6533 0 64V128H42.6667V85.3333C42.6667 73.86 52.1933 64.3333 63.6667 64.3333H85.3333C108.52 64.3333 128 44.8533 128 21.6667C128 9.69333 118.307 0 106.333 0H64Z" fill="white"/>
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">FenrirPDF</span>
                </header>

                <div className="mb-10 text-left">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                    Merge. Extract. Done.
                  </h1>
                  <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    Your everyday PDF tool – lightweight, fast, no signup.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/merge">
                    <div className="bg-white/70 dark:bg-white/10 p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <MergeIcon />
                      <p className="mt-4 font-bold text-lg text-gray-800 dark:text-white">Merge PDFs</p>
                    </div>
                  </Link>
                  <Link href="/edit">
                    <div className="bg-white/70 dark:bg-white/10 p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <ExtractIcon />
                      <p className="mt-4 font-bold text-lg text-gray-800 dark:text-white">Extract Pages</p>
                    </div>
                  </Link>
                </div>
                
                <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    All processing is done locally in your browser.
                </p>
            </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground space-y-2">
        <p>Made with ❤️ by Fenrir</p>
        <a href="https://www.buymeacoffee.com/fenrir" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
            <Coffee className="h-4 w-4"/> Buy me a coffee
        </a>
      </footer>
    </div>
  );
}
