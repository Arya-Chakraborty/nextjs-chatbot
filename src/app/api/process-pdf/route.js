import { processPDFAndSaveChunks } from '@/utils/pdf-chunker'; // Import the utility function
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req) {

    try {

        const data = await req.formData();
        const pdfFile = data.get('pdf');

        if (!pdfFile) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const bytes = await pdfFile.arrayBuffer()
        const buffer = Buffer.from(bytes);

        const pdfPath = path.join(process.cwd(), 'temp.pdf'); // Temporary file path
        fs.writeFileSync(pdfPath, buffer);

        const chunksDir = path.join(process.cwd(), 'chunks');
        const filename = path.basename(pdfFile.name, path.extname(pdfFile.name));
        const outputPath = path.join(chunksDir, `${filename}.json`);
        const maxChunkSize = 800;

        await processPDFAndSaveChunks(pdfPath, outputPath, maxChunkSize);

        fs.unlinkSync(pdfPath); // Clean up the temporary PDF

        return new NextResponse(JSON.stringify({ message: `Chunks saved to ${outputPath}` }), {
            status: 200,
        });

    } catch (error) {
        console.error("Error processing PDF:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
}