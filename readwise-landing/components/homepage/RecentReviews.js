import Link from "next/link";
import Image from "next/image";

export default function RecentReviews({ reviews }) {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-500">No reviews yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">⭐ Recent Reviews</h3>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold flex-shrink-0">
                                {review.user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold text-gray-800">
                                        {review.user?.full_name || 'Anonymous'}
                                    </p>
                                    <div className="flex text-yellow-400">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <Link href={`/books/${review.book_id}`} className="hover:underline">
                                    <p className="text-sm text-blue-900 font-medium">
                                        {review.book?.title}
                                    </p>
                                </Link>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {review.review_text}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <button className="hover:text-blue-900 transition">
                                        👍 Helpful ({review.helpful_count || 0})
                                    </button>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center">
                <Link href="/reviews" className="text-blue-900 hover:underline text-sm">
                    Read All Reviews →
                </Link>
            </div>
        </div>
    );
}