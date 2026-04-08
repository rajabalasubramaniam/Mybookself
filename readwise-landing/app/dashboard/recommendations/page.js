"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import axios from "axios";

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userGenres, setUserGenres] = useState([]);
    const [userAuthors, setUserAuthors] = useState([]);
    const supabase = createClient();

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get user's finished books
            const { data: finishedBooks } = await supabase
                .from('books')
                .select('genre, author')
                .eq('user_id', user.id)
                .eq('reading_status', 'finished')
                .not('genre', 'is', null);

            // 2. Extract favorite genres and authors
            const genreCount = {};
            const authorCount = {};
            finishedBooks?.forEach(book => {
                if (book.genre) genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
                if (book.author) authorCount[book.author] = (authorCount[book.author] || 0) + 1;
            });

            const topGenres = Object.entries(genreCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(g => g[0]);

            const topAuthors = Object.entries(authorCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(a => a[0]);

            setUserGenres(topGenres);
            setUserAuthors(topAuthors);

            // 3. Search for recommendations using Open Library API
            const searchQueries = [...topGenres, ...topAuthors];
            const bookPromises = searchQueries.slice(0, 5).map(async (query) => {
                try {
                    const response = await axios.get(
                        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`
                    );
                    return response.data.docs.map(book => ({
                        title: book.title,
                        author: book.author_name?.[0] || 'Unknown',
                        coverId: book.cover_i,
                        year: book.first_publish_year,
                        key: book.key,
                        reason: `Because you like ${query}`
                    }));
                } catch (err) {
                    return [];
                }
            });

            const results = await Promise.all(bookPromises);
            const allBooks = results.flat();
            
            // Remove duplicates (by title)
            const uniqueBooks = [];
            const titles = new Set();
            for (const book of allBooks) {
                if (!titles.has(book.title.toLowerCase())) {
                    titles.add(book.title.toLowerCase());
                    uniqueBooks.push(book);
                }
            }

            setRecommendations(uniqueBooks.slice(0, 12));
        } catch (error) {
            console.error('Error loading recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-blue-900 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-blue-900 mb-2">📖 Book Recommendations</h1>
                <p className="text-gray-600 mb-8">
                    Based on your reading history, we think you'll enjoy these books.
                </p>

                {/* User Reading Profile */}
                {(userGenres.length > 0 || userAuthors.length > 0) && (
                    <div className="bg-white rounded-xl shadow p-6 mb-8">
                        <h2 className="text-lg font-semibold text-blue-900 mb-3">Your Reading Profile</h2>
                        {userGenres.length > 0 && (
                            <p className="text-gray-700">
                                📚 You enjoy: <strong>{userGenres.join(', ')}</strong>
                            </p>
                        )}
                        {userAuthors.length > 0 && (
                            <p className="text-gray-700 mt-2">
                                ✍️ Favorite authors: <strong>{userAuthors.join(', ')}</strong>
                            </p>
                        )}
                    </div>
                )}

                {recommendations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow">
                        <p className="text-gray-500 mb-4">
                            Finish some books and add genres to get personalized recommendations.
                        </p>
                        <Link href="/books" className="bg-blue-900 text-white px-6 py-3 rounded-lg">
                            Explore Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recommendations.map((book, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                                {book.coverId ? (
                                    <img 
                                        src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
                                        alt={book.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">No cover</span>
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="font-bold text-blue-900 line-clamp-2">{book.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                                    {book.year && <p className="text-xs text-gray-400 mt-1">{book.year}</p>}
                                    <p className="text-xs text-amber-600 mt-2 italic">{book.reason}</p>
                                    <a 
                                        href={`https://openlibrary.org${book.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block text-sm text-blue-900 hover:underline"
                                    >
                                        Learn More →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}