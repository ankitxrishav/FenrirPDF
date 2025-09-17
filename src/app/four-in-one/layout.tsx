import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Combine 4 PDF Pages into 1 | Free Online Tool',
  description: 'Easily combine four pages of your PDF onto a single A4 page in a 2x2 grid. Our free online tool is perfect for printing handouts, notes, or archiving documents. No uploads, 100% private.',
  alternates: {
    canonical: '/four-in-one',
  },
  openGraph: {
    title: 'Combine 4 PDF Pages into 1 | fenrirPDF',
    description: 'Arrange four PDF pages into a single A4 page in a 2x2 grid layout. Perfect for printing and archiving.',
    url: '/four-in-one',
  },
  twitter: {
    title: 'Combine 4 PDF Pages into 1 | fenrirPDF',
    description: 'Arrange four PDF pages into a single A4 page in a 2x2 grid layout. Perfect for printing and archiving.',
  }
};

export default function FourInOneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
