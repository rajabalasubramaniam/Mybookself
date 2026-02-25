"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function UpdateProgress({ book }) {
    const [currentPage, setCurrentPage] = useState(book.current_page || 0);
    const [pagesRead, setPagesRead] = useState("");
    const [minutesRead, setMinutesRead] = useState("");
    const [status, setStatus] = useState(book.status);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleUpdateProgress = async () => {
        if (!pagesRead) return;
        
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const newPageCount = currentPage + parseInt(pagesRead);
            const newStatus = newPageCount >= book.total_pages ? 'finished' : 'reading';

            // Update book progress
            const { error: bookError } = await supabase
                .from('books')
                .update({
                    current_page: newPageCount,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', book.id);

            if (bookError) throw bookError;

            // Record reading session
            const { error: sessionError } = await supabase
                .from('reading_sessions')
                .insert({
                    book_id: book.id,
                    user_id: book.user_id,
                    pages_read: parseInt(pagesRead),
                    minutes_read: parseInt(minutesRead) || null,
                });

            if (sessionError) throw sessionError;

            setCurrentPage(newPageCount);
            setStatus(newStatus);
            setPagesRead("");
            setMinutesRead("");
            setSuccess(true);
            
            // Refresh the page data
            router.refresh();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsFinished = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('books')
                .update({
                    current_page: book.total_pages,
                    status: 'finished',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', book.id);

            if (error) throw error;

            // Record final session
            await supabase
                .from('reading_sessions')
                .insert({
                    book_id: book.id,
                    user_id: book.user_id,
                    pages_read: book.total_pages - currentPage,
                });

            setCurrentPage(book.total_pages);
            setStatus('finished');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="p-3 bg-green-100 text-green-700 rounded">
                    Progress updated successfully!
                </div>
            )}

            {status !== 'finished' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Pages read</label>
                            <input
                                type="number"
                                value={pagesRead}
                                onChange={(e) => setPagesRead(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="e.g., 30"
                                min="1"
                                max={book.total_pages - currentPage}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Minutes read</label>
                            <input
                                type="number"
                                value={minutesRead}
                                onChange={(e) => setMinutesRead(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="Optional"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={handleUpdateProgress}
                            disabled={loading || !pagesRead}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Progress"}
                        </button>

                        {book.total_pages && currentPage < book.total_pages && (
                            <button
                                onClick={handleMarkAsFinished}
                                disabled={loading}
                                className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                            >
                                Mark as Finished
                            </button>
                        )}
                    </div>
                </div>
            )}

            {status === 'finished' && (
                <div className="p-4 bg-green-100 text-green-800 rounded-lg text-center">
                    🎉 You've finished this book! Great job!
                </div>
            )}
        </div>
    );
}