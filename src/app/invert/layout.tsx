import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invert PDF Colors | Free Online Dark Mode Tool',
  description: 'Easily invert the colors of your PDF document. Ideal for night mode reading, dark mode, or printing with less ink. 100% free and private.',
  alternates: {
    canonical: '/invert',
  },
  openGraph: {
    title: 'Invert PDF Colors | Free Online Dark Mode Tool | fenrirPDF',
    description: 'Switch your PDF to dark mode instantly. Invert colors for better readability and ink saving.',
    url: '/invert',
  },
  twitter: {
    title: 'Invert PDF Colors | Free Online Dark Mode Tool | fenrirPDF',
    description: 'Switch your PDF to dark mode instantly. Invert colors for better readability and ink saving.',
  }
};

export default function InvertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
