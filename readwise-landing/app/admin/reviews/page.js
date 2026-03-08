"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const supabase = createClient();

    useEffect(() => {
        loadPendingReviews();
    }, []);

	const loadPendingReviews = async () => {
    try {
        console.log("Loading pending reviews...");
        
        // Get reviews first
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('user_reviews')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        
        console.log("Raw reviews:", reviewsData);

        if (!reviewsData || reviewsData.length === 0) {
            setReviews([]);
            setLoading(false);
            return;
        }

        // Get ALL users that have reviews (even if no profile)
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: usersData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

        // Get book details
        const bookIds = [...new Set(reviewsData.map(r => r.book_id))];
        const { data: booksData } = await supabase
            .from('books')
            .select('id, title, author, cover_url')
            .in('id', bookIds);

        // Create a map for quick lookup
        const userMap = Object.fromEntries((usersData || []).map(u => [u.id, u]));
        const bookMap = Object.fromEntries((booksData || []).map(b => [b.id, b]));

        // Enrich reviews with available data, providing defaults for missing data
        const enrichedReviews = reviewsData.map(review => ({
            ...review,
            user: userMap[review.user_id] || { 
                full_name: 'User (Profile Missing)', 
                email: 'No email' 
            },
            book: bookMap[review.book_id] || { 
                title: 'Book Removed', 
                author: 'Unknown',
                cover_url: null 
            }
        }));

        console.log("Enriched reviews:", enrichedReviews);
        setReviews(enrichedReviews);

    } catch (error) {
        console.error('Error loading reviews:', error);
    } finally {
        setLoading(false);
    }
};

    const approveReview = async (reviewId) => {
        setProcessing(prev => ({ ...prev, [reviewId]: 'approving' }));
        try {
            const { error } = await supabase
                .from('user_reviews')
                .update({ 
                    is_approved: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;
            
            // Remove from list
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (error) {
            console.error('Error approving review:', error);
            alert('Failed to approve review');
        } finally {
            setProcessing(prev => ({ ...prev, [reviewId]: null }));
        }
    };

	const rejectReview = async (reviewId) => {
    const reason = prompt('Please enter reason for rejection (will be visible to user):');
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
        alert('Please provide a reason for rejection');
        return;
    }
    
    setProcessing(prev => ({ ...prev, [reviewId]: 'rejecting' }));
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
            .from('user_reviews')
            .update({ 
                is_approved: false,
                rejection_reason: reason,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', reviewId);

        if (error) throw error;
        
        // Remove from pending list
        setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
        console.error('Error rejecting review:', error);
        alert('Failed to reject review');
    } finally {
        setProcessing(prev => ({ ...prev, [reviewId]: null }));
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pending Reviews</h1>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {reviews.length} pending
                </span>
            </div>

            {reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <p className="text-gray-500 text-lg">✨ No pending reviews</p>
                    <p className="text-gray-400 text-sm mt-2">All caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Book Info Header */}
                            <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-3">
                                {review.book?.cover_url ? (
                                    <img 
                                        src={review.book.cover_url} 
                                        alt={review.book.title}
                                        className="w-8 h-10 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-8 h-10 bg-gray-200 rounded"></div>
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
                                        <p className="font-semibold text-gray-800">
                                            {review.user?.full_name || 'Anonymous'}
                                        </p>
                                        <p className="text-sm text-gray-500">{review.user?.email}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex text-yellow-400">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(review.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-700 whitespace-pre-wrap">{review.review_text}</p>

                                {review.is_hint && (
                                    <span className="inline-block mt-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                        💡 Hint/Tip
                                    </span>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6 pt-4 border-t">
                                    <button
                                        onClick={() => approveReview(review.id)}
                                        disabled={processing[review.id]}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing[review.id] === 'approving' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Approving...
                                            </>
                                        ) : (
                                            <>
                                                <span>✓</span> Approve
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => rejectReview(review.id)}
                                        disabled={processing[review.id]}
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing[review.id] === 'rejecting' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Rejecting...
                                            </>
                                        ) : (
                                            <>
                                                <span>✕</span> Reject
                                            </>
                                        )}
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