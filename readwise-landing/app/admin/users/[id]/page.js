"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";

export default function UserDetail({ params }) {
    const [user, setUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', params.id)
                .single();

            // Get user's books
            const { data: userBooks } = await supabase
                .from('books')
                .select('*')
                .eq('user_id', params.id)
                .order('created_at', { ascending: false });

            // Get user's reviews
            const { data: userReviews } = await supabase
                .from('user_reviews')
                .select(`
                    *,
                    book:books(title)
                `)
                .eq('user_id', params.id)
                .order('created_at', { ascending: false });

            setUser(profile);
            setBooks(userBooks || []);
            setReviews(userReviews || []);
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div>
            <Link href="/admin/users" className="text-blue-900 hover:underline mb-4 inline-block">
                ← Back to Users
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user?.full_name || 'No name'}</h1>
                        <p className="text-gray-600">@{user?.username || 'no-username'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Joined: {new Date(user?.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-900">{books.length}</p>
                        <p className="text-sm text-gray-600">Books</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{reviews.length}</p>
                        <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-500">
                            {reviews.filter(r => r.is_approved).length}
                        </p>
                        <p className="text-sm text-gray-600">Approved</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Books */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Books</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {books.map(book => (
                            <Link key={book.id} href={`/books/${book.id}`}>
                                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} className="w-10 h-12 object-cover rounded" />
                                    ) : (
                                        <div className="w-10 h-12 bg-gray-200 rounded"></div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{book.title}</p>
                                        <p className="text-sm text-gray-600">{book.author || 'Unknown'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Reviews */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Reviews</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {reviews.map(review => (
                            <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium">{review.book?.title}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {review.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex text-yellow-400 text-sm mb-1">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{review.review_text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}