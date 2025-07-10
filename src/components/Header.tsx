import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const FenrirLogo = () => (
    <svg width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M64 0C28.6533 0 0 28.6533 0 64V128H42.6667V85.3333C42.6667 73.86 52.1933 64.3333 63.6667 64.3333H85.3333C108.52 64.3333 128 44.8533 128 21.6667C128 9.69333 118.307 0 106.333 0H64Z" fill="currentColor"/>
    </svg>
);


export function Header() {
  return (
    <header className="w-full p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <div className="text-primary">
            <FenrirLogo />
          </div>
          <span className="font-headline">fenrirPDF</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
