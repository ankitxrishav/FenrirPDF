import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="w-full p-4 relative z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <Image src="/iconF.svg" alt="FenrirPDF Logo" width={28} height={28} />
          <span className="font-headline">fenrirPDF</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
