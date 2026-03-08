"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import axios from "axios";

export default function AdminTrending() {
    const [trending, setTrending] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [trendingRes, booksRes] = await Promise.all([
                supabase
                    .from('trending_books')
                    .select(`
                        *,
                        book:books(*)
                    `)
                    .order('rank', { ascending: true }),
                supabase
                    .from('books')
                    .select('id, title, author, cover_url')
                    .order('title')
            ]);

            setTrending(trendingRes.data || []);
            setBooks(booksRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFromAPI = async () => {
        setFetching(true);
        try {
            const response = await axios.get('/api/trending');
            alert(response.data.message);
            loadData();
        } catch (error) {
            console.error('Error fetching trending:', error);
            alert('Failed to fetch trending books');
        } finally {
            setFetching(false);
        }
    };

    const updateRank = async (id, newRank) => {
        try {
            const { error } = await supabase
                .from('trending_books')
                .update({ rank: newRank })
                .eq('id', id);

            if (error) throw error;
            loadData();
        } catch (error) {
            console.error('Error updating rank:', error);
        }
    };

    const addManual = async (bookId) => {
        const nextRank = trending.length + 1;
        try {
            const { error } = await supabase
                .from('trending_books')
                .insert({
                    book_id: bookId,
                    rank: nextRank,
                    trend_type: 'daily',
                    source: 'manual'
                });

            if (error) throw error;
            loadData();
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const removeBook = async (id) => {
        if (!confirm('Remove this book from trending?')) return;

        try {
            const { error } = await supabase
                .from('trending_books')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadData();
        } catch (error) {
            console.error('Error removing book:', error);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Trending Books</h1>
                <button
                    onClick={fetchFromAPI}
                    disabled={fetching}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    {fetching ? 'Fetching...' : '🔄 Fetch from API'}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Current Trending */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Current Trending Books</h2>
                    <div className="space-y-3">
                        {trending.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="font-bold text-blue-900">#{item.rank}</span>
                                {item.book?.cover_url ? (
                                    <img src={item.book.cover_url} alt={item.book.title} className="w-10 h-12 object-cover rounded" />
                                ) : (
                                    <div className="w-10 h-12 bg-gray-200 rounded"></div>
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold">{item.book?.title}</p>
                                    <p className="text-sm text-gray-600">{item.book?.author}</p>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        defaultValue={item.rank}
                                        onBlur={(e) => updateRank(item.id, parseInt(e.target.value))}
                                        className="w-16 px-2 py-1 border rounded text-center"
                                        min="1"
                                    />
                                    <button
                                        onClick={() => removeBook(item.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Books */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Add Books to Trending</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {books
                            .filter(book => !trending.some(t => t.book_id === book.id))
                            .map(book => (
                                <div key={book.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} className="w-8 h-10 object-cover rounded" />
                                    ) : (
                                        <div className="w-8 h-10 bg-gray-200 rounded"></div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{book.title}</p>
                                        <p className="text-xs text-gray-600">{book.author}</p>
                                    </div>
                                    <button
                                        onClick={() => addManual(book.id)}
                                        className="bg-blue-900 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-800"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}