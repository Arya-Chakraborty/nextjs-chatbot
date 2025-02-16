'use client';
import { useState } from 'react';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setGeminiResponse('');

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, filename: 'my-document' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || response.statusText);
            }

            const data = await response.json();
            setGeminiResponse(data.geminiResponse);

        } catch (err) {
            console.error("Error searching chunks:", err);
            setError("Error searching chunks: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen"> {/* Centering */}
            <h1 className="text-3xl font-bold mb-4">PDF Chatbot</h1>

            <div className="w-full max-w-md mb-4"> {/* Input width constraint */}
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.toLowerCase())}
                placeholder="Enter your prompt"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" // Added text-black
            />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Gemini Response Box */}
            {geminiResponse && (
                <div className="w-full max-w-2xl p-4 border rounded-md shadow-md bg-gray-100"> {/* Response width and styling */}
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Chatbot Response:</h2>
                    <p className="text-gray-800">{geminiResponse}</p>
                </div>
            )}
        </div>
    );
}