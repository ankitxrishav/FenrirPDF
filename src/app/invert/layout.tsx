
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invert PDF Colors | Selectively Invert Pages Free',
  description: 'Manually select and invert the colors of specific pages in your PDF. Perfect for turning dark-mode pages to light or for creative effects. 100% free and private.',
  alternates: {
    canonical: '/invert',
  },
  openGraph: {
    title: 'Invert PDF Colors | Selectively Invert Pages Free | fenrirPDF',
    description: 'Manually select and invert the colors of specific pages in your PDF. Ideal for fixing dark pages.',
    url: '/invert',
  },
  twitter: {
    title: 'Invert PDF Colors | Selectively Invert Pages Free | fenrirPDF',
    description: 'Manually select and invert the colors of specific pages in your PDF. Ideal for fixing dark pages.',
  }
};

export default function InvertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
