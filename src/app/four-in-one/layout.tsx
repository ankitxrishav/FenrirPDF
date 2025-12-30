import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Combine PDF Pages into One | 2-in-1, 4-in-1, 8-in-1 Tool',
  description: 'Easily combine two, four, or eight pages of your PDF onto a single A4 page. Our free online tool is perfect for printing handouts, notes, or archiving documents. No uploads, 100% private.',
  alternates: {
    canonical: '/four-in-one',
  },
  openGraph: {
    title: 'Combine PDF Pages into One | 2-in-1, 4-in-1, 8-in-1 | fenrirPDF',
    description: 'Arrange multiple PDF pages into a single page with layouts like 2-in-1, 4-in-1, or 8-in-1. Perfect for printing and archiving.',
    url: '/four-in-one',
  },
  twitter: {
    title: 'Combine PDF Pages into One | 2-in-1, 4-in-1, 8-in-1 | fenrirPDF',
    description: 'Arrange multiple PDF pages into a single page with layouts like 2-in-1, 4-in-1, or 8-in-1. Perfect for printing and archiving.',
  }
};

export default function FourInOneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
