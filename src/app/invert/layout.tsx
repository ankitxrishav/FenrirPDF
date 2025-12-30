import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Normalize PDF Backgrounds | Free Online Dark Mode Fixer',
  description: 'Automatically detect and invert dark pages in your PDF to create a consistent white background. Perfect for fixing mixed-light and dark-mode documents. 100% free and private.',
  alternates: {
    canonical: '/invert',
  },
  openGraph: {
    title: 'Normalize PDF Backgrounds | Free Online Dark Mode Fixer | fenrirPDF',
    description: 'Automatically fix dark-background pages in your PDF for consistent white backgrounds. Ideal for printing and reading.',
    url: '/invert',
  },
  twitter: {
    title: 'Normalize PDF Backgrounds | Free Online Dark Mode Fixer | fenrirPDF',
    description: 'Automatically fix dark-background pages in your PDF for consistent white backgrounds. Ideal for printing and reading.',
  }
};

export default function InvertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
