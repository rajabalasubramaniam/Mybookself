"use client";
import { useState } from "react";
import { searchBooksByTitle } from "../../../lib/bookSearch";
import Link from "next/link";

export default function SearchBooks() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        const books = await searchBooksByTitle(query);
        setResults(books);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-4">
                    <Link href="/books" className="text-blue-900 hover:underline">
                        ← Back to Library
                    </Link>
                </div>
                
                <h1 className="text-3xl font-bold text-blue-900 mb-6">🔍 Search Books</h1>
                
                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by title or author..."
                        className="flex-1 px-4 py-2 border rounded-lg"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>

                <div className="grid gap-4">
                    {results.map((book, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow flex gap-4">
                            {book.cover_url && (
                                <img src={book.cover_url} alt={book.title} className="w-16 h-20 object-cover" />
                            )}
                            <div>
                                <h3 className="font-semibold">{book.title}</h3>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <p className="text-xs text-gray-400 mt-1">Source: {book.source}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}