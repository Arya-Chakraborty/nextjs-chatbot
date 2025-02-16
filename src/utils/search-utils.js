import nlp from "compromise";
import stringSimilarity from 'string-similarity';


function calculateTF(words, uniqueWords) {
    const tf = {};
    uniqueWords.forEach((word) => {
        const count = words.filter((w) => w === word).length;
        tf[word] = count / words.length;
    });
    return tf;
}


function calculateIDF(docs, uniqueWords) {
    const totalDocs = docs.length;
    const idf = {};
    uniqueWords.forEach((word) => {
        let docsWithWord = 0;
        for (const doc of docs) {
            if (doc.includes(word)) {
                docsWithWord++;
            }
        }
        idf[word] = Math.log(totalDocs / (1 + docsWithWord));
    });

    return idf;
}


function calculateTFIDFVector(words, uniqueWords, idf) {
    const tf = calculateTF(words, uniqueWords);
    return uniqueWords.map((word) => tf[word] * idf[word] || 0);
}


function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, value, index) => sum + value * vec2[index], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, value) => sum + value ** 2, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, value) => sum + value ** 2, 0));
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
}


export async function getGeminiAnswer(userQuery, chunks) {
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBkyHKIW_LmTQr029mky-9ImgDQm7i6grs"
    try {
        const context = chunks.map(chunk => chunk.chunk).join("\n\n");
        const prompt = `Use the following context to answer the question:\n\n${context}\n\nQuestion: ${userQuery}`;
        const payload = {
            "contents": [{ "parts": [{ "text": prompt }] }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 500
            }
        };
        const headers = { "Content-Type": "application/json" };
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
            timeout: 10000
        });
        if (!response.ok) {
            const errorData = await response.json(); // Try to parse error response
            throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) {
            return result.candidates[0].content.parts[0].text.trim();
        } else {
            console.error("Unexpected Gemini API response:", result);
            return "Sorry, I couldn't get a good answer. Please try rephrasing.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Error fetching response. Please try again later.";
    }
}


export async function calculateTfIdfSimilarity(prompt, chunks) {
    const allDocs = [prompt, ...chunks.map((chunk) => chunk.chunk)];
    const stemmedDocs = allDocs.map(doc => nlp(doc).terms().normalize().out("array"));
    const uniqueWords = [...new Set(stemmedDocs.flat())];
    const idf = calculateIDF(stemmedDocs, uniqueWords);
    const tfidfVectors = stemmedDocs.map((doc) => calculateTFIDFVector(doc, uniqueWords, idf));
    const promptVector = tfidfVectors[0];
    const rankedChunks = chunks.map((chunk, index) => {
        const chunkVector = tfidfVectors[index + 1];
        let similarity = cosineSimilarity(promptVector, chunkVector);
        if (isNaN(similarity) || !isFinite(similarity)) { similarity = 0; }
        const stringSim = stringSimilarity.compareTwoStrings(prompt.toLowerCase(), chunk.chunk.toLowerCase());
        const combinedSimilarity = Math.max(similarity, stringSim * 0.6); 
        return { ...chunk, similarity: combinedSimilarity };
    }).sort((a, b) => b.similarity - a.similarity);
    const SIMILARITY_THRESHOLD = 0.01;
    const TOP_N = Math.min(5, chunks.length);
    const filteredChunks = rankedChunks.filter((chunk) => chunk.similarity >= SIMILARITY_THRESHOLD);
    return filteredChunks.slice(0, TOP_N);
}


export async function searchAndGenerate(prompt, chunks) {
    const topChunks = await calculateTfIdfSimilarity(prompt, chunks);
    console.log(topChunks);
    if (topChunks.length > 0) {
        const geminiResponse = await getGeminiAnswer(prompt, topChunks);
        return {
            chunks: topChunks,
            geminiResponse: geminiResponse
        };
    } else {
        return {
            chunks: [],
            geminiResponse: "Prompt out of context. No relevant information found."
        };
    }
}