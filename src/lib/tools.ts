/**
 * Single source of truth for all FenrirPDF tools.
 * Used by the homepage feature cards and the sitemap.
 * Add new tools here first – the rest of the UI picks them up automatically.
 */

export interface Tool {
  slug: string;
  title: string;
  description: string;
  /** Lucide icon name (imported separately in each page that needs it) */
  iconName: string;
  /** Sitemap priority (0–1) */
  priority: number;
  /** Short description for SEO meta */
  metaDescription: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'four-in-one',
    title: 'Combine PDF Pages',
    description: 'Arrange multiple pages onto a single sheet.',
    iconName: 'Grid',
    priority: 0.9,
    metaDescription: 'Combine multiple PDF pages onto a single sheet. Free, fast, and 100% private — no uploads, no sign-up.',
  },
  {
    slug: 'invert',
    title: 'Invert PDF Colors',
    description: 'Selectively invert the colors of specific pages.',
    iconName: 'RefreshCcw',
    priority: 0.9,
    metaDescription: 'Invert colors of specific PDF pages for dark-mode printing or night reading. Free, browser-only tool.',
  },
  {
    slug: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert images into a single PDF.',
    iconName: 'Image',
    priority: 0.9,
    metaDescription: 'Convert JPG and PNG images to PDF instantly. Drag to reorder, choose layout. Free, private, browser-side only.',
  },
  {
    slug: 'merge',
    title: 'Merge PDFs',
    description: 'Combine multiple PDFs into one.',
    iconName: 'Merge',
    priority: 0.8,
    metaDescription: 'Merge multiple PDF files into one document online. Free PDF merger — no uploads, no sign-up, 100% private.',
  },
  {
    slug: 'extract',
    title: 'Extract & Reorder',
    description: 'Reorder and delete pages from your PDF.',
    iconName: 'Scissors',
    priority: 0.8,
    metaDescription: 'Extract specific pages from a PDF, reorder them, and delete unwanted pages. Free, browser-only, 100% private.',
  },
  {
    slug: 'rotate',
    title: 'Rotate Pages',
    description: 'Rotate PDF pages clockwise or counter-clockwise.',
    iconName: 'RotateCw',
    priority: 0.8,
    metaDescription: 'Rotate individual pages in your PDF document. Free, browser-only, 100% private.',
  },
  {
    slug: 'number',
    title: 'Add Page Numbers',
    description: 'Insert page numbers into your PDF.',
    iconName: 'Baseline',
    priority: 0.7,
    metaDescription: 'Add page numbers to your PDF documents online. Customize position and style. Free, private, no server uploads.',
  },
  {
    slug: 'watermark',
    title: 'Add Watermark',
    description: 'Stamp text or an image over your PDF.',
    iconName: 'Droplet',
    priority: 0.7,
    metaDescription: 'Add a custom text or image watermark to your PDF. Live preview, customizable rotation and opacity. Free and private.',
  },
];

export const BASE_URL = 'https://fenrirpdf.netlify.app';
