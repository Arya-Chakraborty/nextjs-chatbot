'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
    // Chatbot States
    const [prompt, setPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cursor & Highlight States
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const bitotsavRef = useRef(null);
    const [highlightedIndices, setHighlightedIndices] = useState(new Set());

    // Handle Chatbot Search
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

    // Track Cursor Position and Highlight Characters
    useEffect(() => {
    const handleMouseMove = (event) => {
        requestAnimationFrame(() => {
            setCursorPos({
                x: event.clientX + window.scrollX, // Account for horizontal scroll
                y: event.clientY + window.scrollY, // Account for vertical scroll
            });

            if (bitotsavRef.current) {
                const haloRect = {
                    x: event.clientX + window.scrollX - 50, // Adjust for scroll
                    y: event.clientY + window.scrollY - 50, // Adjust for scroll
                    width: 100,
                    height: 100,
                };

                const indicesToHighlight = new Set();
                const bitotsavText = bitotsavRef.current.textContent;

                for (let i = 0; i < bitotsavText.length; i++) {
                    const charRect = getCharRect(bitotsavRef.current, i);
                    if (rectIntersection(haloRect, charRect)) {
                        indicesToHighlight.add(i);
                    }
                }

                setHighlightedIndices(indicesToHighlight);
            }
        });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
    };
}, []);


    // Get bounding rectangle of a character
    function getCharRect(element, index) {
        if (!element.firstChild) return { x: 0, y: 0, width: 0, height: 0 }; // Handle edge case

        const range = document.createRange();
        range.setStart(element.firstChild, index);
        range.setEnd(element.firstChild, index + 1);
        return range.getBoundingClientRect();
    }

    // Check intersection between two rectangles
    function rectIntersection(rect1, rect2) {
        return !(
            rect1.x > rect2.x + rect2.width ||
            rect1.x + rect1.width < rect2.x ||
            rect1.y > rect2.y + rect2.height ||
            rect1.y + rect1.height < rect2.y
        );
    }

    const bitotsavStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20vw',
        fontWeight: 'bold',
        color: 'transparent',
        mixBlendMode: 'difference',
        userSelect: 'none',
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black min-h-screen flex flex-col items-center justify-center font-mono overflow-hidden relative">
            {/* Chatbot Interface */}
            <div className="backdrop-blur-lg bg-opacity-30 p-8 rounded-3xl shadow-lg w-full max-w-3xl z-10">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 text-center animate-pulse">
                    Pucho Jo Marzi
                </h1>

                <div className="relative mb-6">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.toLowerCase())}
                        placeholder="Enter your prompt"
                        className="w-full px-6 py-4 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-md transition duration-300"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold hover:bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : "Search"}
                </button>

                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                {geminiResponse && (
                    <div className="mt-8 p-6 border border-gray-700 rounded-2xl bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg text-white">
                        <h2 className="text-2xl font-semibold mb-4 text-purple-400">Chatbot Response:</h2>
                        <p className="whitespace-pre-wrap">{geminiResponse}</p>
                    </div>
                )}
            </div>

            {/* Cursor Halo */}
            <div
                className="absolute rounded-full bg-purple-400 bg-opacity-20 transition duration-300 pointer-events-none"
                style={{
                    width: 100,
                    height: 100,
                    left: cursorPos.x - 50,
                    top: cursorPos.y - 50,
                    transform: `translate3d(0, 0, 0)`,
                }}
            ></div>

            {/* BITOTSAV Dynamic Highlighting */}
            <div style={bitotsavStyle} ref={bitotsavRef}>
                BITOTSAV
            </div>

            <div style={bitotsavStyle} className="pointer-events-none">
                {"BITOTSAV".split("").map((char, index) => (
                    <span
                        key={index}
                        style={{
                            color: highlightedIndices.has(index) ? '#a357ba' : 'transparent',
                            transition: 'color 0.5s ease',
                        }}
                    >
                        {char}
                    </span>
                ))}
            </div>


            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute w-40 h-40 bg-purple-500 rounded-full animate-pulse opacity-20" style={{ top: "10%", left: "15%" }}></div>
                <div className="absolute w-24 h-24 bg-pink-500 rounded-full animate-bounce opacity-20" style={{ top: "60%", right: "20%" }}></div>
            </div>
        </div>
    );
}