import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Convert Images to PDF Free | JPG, PNG to PDF Online',
  description: 'Easily convert multiple JPG, PNG, and other images into a single PDF document. Combine images, choose layouts like 2-in-1 or 4-in-1, and download for free. 100% private and secure.',
  alternates: {
    canonical: '/image-to-pdf',
  },
  openGraph: {
    title: 'Free Image to PDF Converter | fenrirPDF',
    description: 'Turn your images (JPG, PNG) into a professional PDF document. Reorder, combine, and choose your layout.',
    url: '/image-to-pdf',
  },
  twitter: {
    title: 'Free Image to PDF Converter | fenrirPDF',
    description: 'Turn your images (JPG, PNG) into a professional PDF document. Reorder, combine, and choose your layout.',
  }
};

export default function ImageToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
