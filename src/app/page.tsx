import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Combine, Scissors } from 'lucide-react';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
            The PDF Toolkit You've Been Waiting For
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Merge, extract, and reorder your PDFs with ease. All processing
            happens on your device. Fast, private, and free.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <Link href="/merge">
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Combine className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-headline">
                    Merge PDFs
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Combine multiple PDF files into one. Reorder files as you wish
                  before merging.
                </p>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end items-center">
                <span className="text-primary font-semibold flex items-center gap-2 group-hover:text-accent transition-colors">
                  Get Started <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Card>
          </Link>

          <Link href="/edit">
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Scissors className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-headline">
                    Extract &amp; Reorder Pages
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">
                  Visually reorder, delete, or extract pages from a PDF file.
                </p>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end items-center">
                <span className="text-primary font-semibold flex items-center gap-2 group-hover:text-accent transition-colors">
                  Get Started <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Card>
          </Link>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Built for privacy. Your files never leave your browser.</p>
      </footer>
    </div>
  );
}
