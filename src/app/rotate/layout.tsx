import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rotate PDF Pages Online Free | fenrirPDF',
  description: 'Rotate individual pages or all pages of your PDF document clockwise or counter-clockwise. Customize rotation with a live preview. 100% free, private, browser-only.',
  alternates: {
    canonical: '/rotate',
  },
  openGraph: {
    title: 'Rotate PDF Pages Online Free | fenrirPDF',
    description: 'Rotate PDF pages easily with live preview. Customize page rotation. Free and private.',
    url: '/rotate',
  },
  twitter: {
    title: 'Rotate PDF Pages Online Free | fenrirPDF',
    description: 'Rotate PDF pages easily with live preview. Customize page rotation. Free and private.',
  },
};

export default function RotateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
