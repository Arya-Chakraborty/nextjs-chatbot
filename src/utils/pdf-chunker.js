import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

export async function extractTextFromPDF(pdfPath) {
    try {
        const data = await pdf(fs.readFileSync(pdfPath));
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return null;
    }
}

export function chunkText(text, maxChunkSize = 500) {
    // Convert the *entire* input text to lowercase *first*
    const lowerCaseText = text.toLowerCase();  // <--- KEY CHANGE

    const paragraphs = lowerCaseText.split(/\r\n|\r|\n/).filter(chunk => chunk.trim() !== ""); // Use lowerCaseText here!
    const chunks = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length + 1 <= maxChunkSize) { // No need to convert again
            currentChunk += (currentChunk ? " " : "") + paragraph;
        } else {
            chunks.push({ chunk: currentChunk });
            currentChunk = paragraph;
        }
    }

    if (currentChunk) {
        chunks.push({ chunk: currentChunk });
    }
    return chunks;
}

export async function processPDFAndSaveChunks(pdfPath, outputPath, maxChunkSize) {
    try {
        const text = await extractTextFromPDF(pdfPath);
        if (!text) {
            throw new Error("Failed to extract text from PDF.");
        }

        const chunks = chunkText(text, maxChunkSize);
        const jsonData = JSON.stringify(chunks, null, 2);

        const chunksDir = path.dirname(outputPath);

        try {
            fs.mkdirSync(chunksDir, { recursive: true });
        } catch (mkdirError) {
            console.error("Error creating directory:", mkdirError);
            throw mkdirError;
        }

        fs.writeFileSync(outputPath, jsonData);
        console.log(`Chunks saved to ${outputPath}`);
    } catch (error) {
        console.error("Error processing and saving chunks:", error);
        throw error;
    }
}