/**
 * @fileOverview A flow for converting various file types to PDF.
 *
 * - convertToPdf - A function that handles the file conversion process.
 * - ConvertToPdfInput - The input type for the convertToPdf function.
 * - ConvertToPdfOutput - The return type for the convertToPdf function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument } from 'pdf-lib';

const FileInputSchema = z.object({
  filename: z.string().describe('The name of the file.'),
  dataUri: z
    .string()
    .describe(
      "The file content as a data URI, including a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const ConvertToPdfInputSchema = z.object({
  files: z.array(FileInputSchema).describe('An array of files to convert.'),
});
export type ConvertToPdfInput = z.infer<typeof ConvertToPdfInputSchema>;

const ConvertToPdfOutputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The resulting PDF file as a data URI, including a MIME type and Base64 encoding."
    ),
});
export type ConvertToPdfOutput = z.infer<typeof ConvertToPdfOutputSchema>;


// This is the main function that will be called from the client.
export async function convertToPdf(input: ConvertToPdfInput): Promise<ConvertToPdfOutput> {
  return convertToPdfFlow(input);
}


const convertToPdfFlow = ai.defineFlow(
  {
    name: 'convertToPdfFlow',
    inputSchema: ConvertToPdfInputSchema,
    outputSchema: ConvertToPdfOutputSchema,
  },
  async (input) => {
    // In a real implementation, you would send these files to a proper
    // conversion service (e.g., a Cloud Function with LibreOffice).
    // For now, we will simulate the conversion by creating a simple PDF
    // that lists the names of the files that were uploaded.
    
    console.log(`Simulating conversion for ${input.files.length} files.`);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    const fileNames = input.files.map(f => f.filename).join('\n');
    
    page.drawText(`Successfully converted files:\n\n${fileNames}`, {
      x: 50,
      y: height - 50,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

    return {
      pdfDataUri: pdfDataUri,
    };
  }
);
