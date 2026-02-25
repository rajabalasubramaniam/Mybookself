import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BooksPage() {
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

    // Get user's books
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Group books by status
    const unreadBooks = books?.filter(b => b.status === 'unread') || []
    const readingBooks = books?.filter(b => b.status === 'reading') || []
    const finishedBooks = books?.filter(b => b.status === 'finished') || []

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/dashboard" className="text-2xl font-bold text-blue-900">
                        ReadWise
                    </Link>
                    <Link 
                        href="/books/add" 
                        className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                    >
                        + Add Book
                    </Link>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow text-center">
                        <span className="text-2xl font-bold text-amber-500">{unreadBooks.length}</span>
                        <p className="text-gray-600">Unread</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow text-center">
                        <span className="text-2xl font-bold text-green-600">{readingBooks.length}</span>
                        <p className="text-gray-600">Reading</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow text-center">
                        <span className="text-2xl font-bold text-blue-900">{finishedBooks.length}</span>
                        <p className="text-gray-600">Finished</p>
                    </div>
                </div>

                {/* Currently Reading Section */}
                {readingBooks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">📖 Currently Reading</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {readingBooks.map(book => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Unread Books */}
                {unreadBooks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">📚 To Be Read</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unreadBooks.map(book => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Finished Books */}
                {finishedBooks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">✅ Finished</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {finishedBooks.map(book => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    </div>
                )}

                {books?.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Your library is empty</p>
                        <Link 
                            href="/books/add" 
                            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800"
                        >
                            Add Your First Book
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

// Book Card Component
function BookCard({ book }) {
    return (
        <Link href={`/books/${book.id}`} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
            <div className="flex">
                {book.cover_url ? (
                    <img 
                        src={book.cover_url} 
                        alt={book.title}
                        className="w-24 h-32 object-cover"
                    />
                ) : (
                    <div className="w-24 h-32 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No cover</span>
                    </div>
                )}
                <div className="flex-1 p-4">
                    <h3 className="font-semibold text-blue-900 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-600">{book.author || 'Unknown'}</p>
                    {book.current_page > 0 && book.total_pages > 0 && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {book.current_page} / {book.total_pages} pages
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}