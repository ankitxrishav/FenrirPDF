import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to Long Image Stitcher | FenrirPDF',
  description: 'Stitch all PDF pages vertically into one long vertical image (PNG or JPG). Ideal for sharing documents on social networks. 100% private.',
};

export default function LongImageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
