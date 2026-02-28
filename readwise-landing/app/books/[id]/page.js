"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

export default function BookPage({ params }) {
    const [book, setBook] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.id;

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        try {
            setLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data: bookData, error: bookError } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .eq('user_id', user.id)
                .single();

            if (bookError) throw bookError;
            if (!bookData) {
                router.push('/books');
                return;
            }

            setBook(bookData);

            const { data: sessionsData } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('book_id', bookId)
                .order('session_date', { ascending: false })
                .limit(10);

            setSessions(sessionsData || []);
        } catch (err) {
            console.error('Error loading book:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateChallengeProgress = async (actionType, pagesRead = 0) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data: userChallenges } = await supabase
                .from('user_challenges')
                .select(`
                    *,
                    challenge:challenges(*)
                `)
                .eq('user_id', user.id)
                .eq('completed', false);

            if (!userChallenges) return;

            for (const uc of userChallenges) {
                let increment = 0;
                
                if (actionType === 'book_finished' && uc.challenge.challenge_type === 'books') {
                    increment = 1;
                } else if (actionType === 'pages_read' && uc.challenge.challenge_type === 'pages') {
                    increment = pagesRead;
                }

                if (increment > 0) {
                    const newValue = uc.current_value + increment;
                    const completed = newValue >= uc.challenge.target_value;

                    await supabase
                        .from('user_challenges')
                        .update({
                            current_value: newValue,
                            completed: completed,
                            completed_at: completed ? new Date().toISOString() : null
                        })
                        .eq('id', uc.id);
                }
            }
        } catch (error) {
            console.error('Error updating challenges:', error);
        }
    };

    const shareBookFinished = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            await supabase
                .from('shares')
                .insert({
                    user_id: user.id,
                    share_type: 'book_finished',
                    reference_id: book.id,
                    share_data: { 
                        title: book.title, 
                        author: book.author,
                        pages: book.total_pages 
                    }
                });

            if (navigator.share) {
                navigator.share({
                    title: 'Just finished a book!',
                    text: `I just finished reading "${book.title}" by ${book.author || 'Unknown'} (${book.total_pages} pages) on ReadWise!`,
                    url: window.location.origin
                });
            } else {
                navigator.clipboard.writeText(
                    `I just finished reading "${book.title}" by ${book.author || 'Unknown'} (${book.total_pages} pages) on ReadWise! ${window.location.origin}`
                );
                alert('✨ Share link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const updateProgress = async (pagesRead, minutesRead) => {
        if (!pagesRead) return;

        try {
            const newPageCount = (book.current_page || 0) + parseInt(pagesRead);
            const newStatus = newPageCount >= book.total_pages ? 'finished' : 'reading';

            const { error: bookError } = await supabase
                .from('books')
                .update({
                    current_page: newPageCount,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', book.id);

            if (bookError) throw bookError;

            const { error: sessionError } = await supabase
                .from('reading_sessions')
                .insert({
                    book_id: book.id,
                    user_id: book.user_id,
                    pages_read: parseInt(pagesRead),
                    minutes_read: parseInt(minutesRead) || null,
                });

            if (sessionError) throw sessionError;

            // Update challenge progress for pages read
            await updateChallengeProgress('pages_read', parseInt(pagesRead));

            setBook({ ...book, current_page: newPageCount, status: newStatus });
            
            const { data: newSessions } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('book_id', book.id)
                .order('session_date', { ascending: false })
                .limit(10);
            
            setSessions(newSessions || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const markAsFinished = async () => {
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

            await supabase
                .from('reading_sessions')
                .insert({
                    book_id: book.id,
                    user_id: book.user_id,
                    pages_read: book.total_pages - (book.current_page || 0),
                });

            // Update challenge progress for finished book
            await updateChallengeProgress('book_finished');

            setBook({ ...book, current_page: book.total_pages, status: 'finished' });
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading book details...</p>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 rounded-xl">
                    <p className="text-red-600 mb-4">{error || "Book not found"}</p>
                    <Link href="/books" className="text-blue-900 hover:underline">
                        ← Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    const progressPercentage = book.total_pages 
        ? Math.round(((book.current_page || 0) / book.total_pages) * 100) 
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/books" className="text-blue-900 hover:underline">
                        ← Back to Library
                    </Link>
                    <Link href="/dashboard" className="text-2xl font-bold text-blue-900">
                        ReadWise
                    </Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/3 p-6">
                            {book.cover_url ? (
                                <img 
                                    src={book.cover_url} 
                                    alt={book.title}
                                    className="w-full rounded-lg shadow-lg"
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400">No cover</span>
                                </div>
                            )}
                        </div>

                        <div className="md:w-2/3 p-6">
                            <h1 className="text-3xl font-bold text-blue-900 mb-2">{book.title}</h1>
                            <p className="text-xl text-gray-600 mb-4">by {book.author || 'Unknown'}</p>
                            
                            {book.isbn && (
                                <p className="text-sm text-gray-500 mb-2">ISBN: {book.isbn}</p>
                            )}
                            
                            <div className="flex items-center space-x-4 mb-6">
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                    book.status === 'finished' ? 'bg-green-100 text-green-800' :
                                    book.status === 'reading' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {book.status}
                                </span>
                                {book.total_pages > 0 && (
                                    <span className="text-gray-600">{book.total_pages} pages</span>
                                )}
                            </div>

                            {book.total_pages > 0 && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Progress</span>
                                        <span>
                                            {book.current_page || 0} / {book.total_pages} pages ({progressPercentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div 
                                            className="bg-green-600 h-4 rounded-full transition-all"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {book.status === 'finished' ? (
                                <div className="mt-6 space-y-4">
                                    <div className="p-4 bg-green-100 text-green-800 rounded-lg text-center">
                                        🎉 Congratulations! You've finished this book!
                                    </div>
                                    <button
                                        onClick={shareBookFinished}
                                        className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center space-x-2"
                                    >
                                        <span>📤</span>
                                        <span>Share Achievement</span>
                                    </button>
                                </div>
                            ) : (
                                <ProgressForm 
                                    book={book} 
                                    onUpdate={updateProgress}
                                    onFinish={markAsFinished}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {sessions.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-blue-900 mb-4">Reading History</h2>
                        <div className="space-y-3">
                            {sessions.map(session => (
                                <div key={session.id} className="flex justify-between items-center border-b pb-2">
                                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                    <span className="text-green-600 font-semibold">
                                        +{session.pages_read} pages
                                    </span>
                                    {session.minutes_read > 0 && (
                                        <span className="text-gray-600">
                                            {session.minutes_read} minutes
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProgressForm({ book, onUpdate, onFinish }) {
    const [pagesRead, setPagesRead] = useState("");
    const [minutesRead, setMinutesRead] = useState("");
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pagesRead) return;
        
        setUpdating(true);
        await onUpdate(pagesRead, minutesRead);
        setPagesRead("");
        setMinutesRead("");
        setUpdating(false);
    };

    const remainingPages = book.total_pages - (book.current_page || 0);

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Pages read</label>
                        <input
                            type="number"
                            value={pagesRead}
                            onChange={(e) => setPagesRead(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                            placeholder={`Max ${remainingPages}`}
                            min="1"
                            max={remainingPages}
                            required
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
                        type="submit"
                        disabled={updating || !pagesRead}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {updating ? "Updating..." : "Update Progress"}
                    </button>

                    {remainingPages > 0 && (
                        <button
                            type="button"
                            onClick={onFinish}
                            disabled={updating}
                            className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                        >
                            Mark as Finished
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}