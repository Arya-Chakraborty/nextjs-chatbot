import { calculateTfIdfSimilarity, searchAndGenerate } from '@/utils/search-utils'; // Import both functions
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
    try {
        const { prompt, filename } = await req.json();

        const chunksPath = path.join(process.cwd(), 'chunks', `${filename}.json`);

        if (!fs.existsSync(chunksPath)) {
            return new NextResponse("Chunks file not found.", { status: 404 });
        }

        const fileContents = fs.readFileSync(chunksPath, 'utf-8');

        try {
            const chunks = JSON.parse(fileContents);

            if (!prompt) {
                return new NextResponse(JSON.stringify({ topChunks: chunks, allChunks: chunks, geminiResponse: "" }), { status: 200 }); // Include empty geminiResponse
            }


            const searchResult = await searchAndGenerate(prompt, chunks); // Use searchAndGenerate

            return new NextResponse(JSON.stringify(searchResult), { status: 200 }); // Send back combined result


        } catch (jsonError) {
            console.error("JSON Parsing Error:", jsonError);
            console.error("Problematic File Contents:", fileContents);
            return new NextResponse("Error parsing JSON file.", { status: 500 });
        }

    } catch (error) {
        console.error("Error searching chunks:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
}