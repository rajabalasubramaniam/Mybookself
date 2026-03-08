"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";

export default function ReviewSection({ bookId }) {
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [isHint, setIsHint] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadReviews();
    }, [bookId]);

    const loadReviews = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data } = await supabase
                .from('user_reviews')
                .select(`
                    *,
                    user:profiles(username, full_name, avatar_url)
                `)
                .eq('book_id', bookId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            setReviews(data || []);

            if (user) {
                const { data: userReviewData } = await supabase
                    .from('user_reviews')
                    .select('*')
                    .eq('book_id', bookId)
                    .eq('user_id', user.id)
                    .single();

                setUserReview(userReviewData);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to leave a review');
                return;
            }

            const { error } = await supabase
                .from('user_reviews')
                .upsert({
                    user_id: user.id,
                    book_id: bookId,
                    rating,
                    review_text: reviewText,
                    is_hint: isHint,
                    is_approved: false // Requires admin approval
                });

            if (error) throw error;

            setShowForm(false);
            setReviewText("");
            setRating(5);
            setIsHint(false);
            alert('Review submitted for approval!');
            loadReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const markHelpful = async (reviewId) => {
        try {
            const { error } = await supabase.rpc('increment_helpful_count', {
                review_id: reviewId
            });

            if (error) throw error;
            loadReviews();
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-4">Loading reviews...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-900">📝 Reviews & Hints</h3>
                {!userReview && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        {showForm ? 'Cancel' : 'Write a Review'}
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-4">Share Your Thoughts</h4>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Rating</label>
                        <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Your Review</label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                            rows="4"
                            placeholder="Share your thoughts about this book..."
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={isHint}
                                onChange={(e) => setIsHint(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-gray-700">This is a quick hint/tip (no spoilers)</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold flex-shrink-0">
                                    {review.user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {review.user?.full_name || 'Anonymous'}
                                                {review.is_hint && (
                                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                        Hint
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex text-yellow-400 mt-1">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-2">{review.review_text}</p>
                                    <button
                                        onClick={() => markHelpful(review.id)}
                                        className="mt-2 text-sm text-gray-500 hover:text-blue-900 transition"
                                    >
                                        👍 Helpful ({review.helpful_count || 0})
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}