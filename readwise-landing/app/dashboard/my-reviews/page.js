"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function MyReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const supabase = createClient();

    useEffect(() => {
        loadMyReviews();
    }, []);

    const loadMyReviews = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data } = await supabase
                .from('user_reviews')
                .select(`
                    *,
                    book:books(title, author, cover_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setReviews(data || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateReview = async (reviewId) => {
        try {
            const { error } = await supabase
                .from('user_reviews')
                .update({ 
                    review_text: editText,
                    is_approved: false, // Requires re-approval
                    rejection_reason: null,
                    reviewed_by: null,
                    reviewed_at: null
                })
                .eq('id', reviewId);

            if (error) throw error;
            
            setEditingId(null);
            loadMyReviews();
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review');
        }
    };

    const deleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const { error } = await supabase
                .from('user_reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
            loadMyReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Link href="/dashboard" className="text-blue-900 hover:underline">
                    ← Back to Dashboard
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-blue-900 mb-8">My Reviews</h1>

            {reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <p className="text-gray-500">You haven't written any reviews yet.</p>
                    <Link href="/books" className="mt-4 inline-block bg-blue-900 text-white px-6 py-3 rounded-lg">
                        Browse Books to Review
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Book Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-4">
                                {review.book?.cover_url ? (
                                    <img 
                                        src={review.book.cover_url} 
                                        alt={review.book.title}
                                        className="w-12 h-16 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-16 bg-gray-200 rounded"></div>
                                )}
                                <div>
                                    <Link href={`/books/${review.book_id}`} className="font-semibold text-blue-900 hover:underline">
                                        {review.book?.title}
                                    </Link>
                                    <p className="text-sm text-gray-600">by {review.book?.author || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                            review.is_approved 
                                                ? 'bg-green-100 text-green-800' 
                                                : review.rejection_reason 
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {review.is_approved 
                                                ? '✓ Approved' 
                                                : review.rejection_reason 
                                                    ? '✗ Rejected' 
                                                    : '⏳ Pending'}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex text-yellow-400">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>

                                {editingId === review.id ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                            rows="4"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => updateReview(review.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-gray-700 whitespace-pre-wrap">{review.review_text}</p>
                                        
                                        {review.is_hint && (
                                            <span className="inline-block mt-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                💡 Hint/Tip
                                            </span>
                                        )}

                                        {/* Rejection Reason - Only shown to the review author */}
                                        {review.rejection_reason && !review.is_approved && (
                                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm font-medium text-red-800 mb-1">
                                                    Why this was rejected:
                                                </p>
                                                <p className="text-sm text-red-700">
                                                    {review.rejection_reason}
                                                </p>
                                                <p className="text-xs text-red-500 mt-2">
                                                    You can edit and resubmit this review.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4 pt-4 border-t">
                                    {!review.is_approved && (
                                        <button
                                            onClick={() => {
                                                setEditingId(review.id);
                                                setEditText(review.review_text);
                                            }}
                                            className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                                        >
                                            ✏️ Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteReview(review.id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}