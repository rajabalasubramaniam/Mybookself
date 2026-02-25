import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UpdateProgress from './UpdateProgress'

export default async function BookPage({ params }) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/auth/login')
    }

    // Get book details
    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

    if (!book) {
        redirect('/books')
    }

    // Get reading sessions for this book
    const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('book_id', params.id)
        .order('session_date', { ascending: false })
        .limit(10)

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
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="md:flex">
                        {/* Book Cover */}
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

                        {/* Book Details */}
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

                            {/* Progress Bar */}
                            {book.total_pages > 0 && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Progress</span>
                                        <span>
                                            {book.current_page || 0} / {book.total_pages} pages
                                            ({Math.round(((book.current_page || 0) / book.total_pages) * 100)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div 
                                            className="bg-green-600 h-4 rounded-full transition-all"
                                            style={{ width: `${((book.current_page || 0) / book.total_pages) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Update Progress Component */}
                            <UpdateProgress book={book} />
                        </div>
                    </div>
                </div>

                {/* Reading History */}
                {sessions && sessions.length > 0 && (
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
    )
}