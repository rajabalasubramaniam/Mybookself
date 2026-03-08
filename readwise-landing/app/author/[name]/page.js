import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function AuthorPage({ params }) {
    const authorName = decodeURIComponent(params.name)
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

    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('author', authorName)
        .order('title')

    const { data: reviews } = await supabase
        .from('user_reviews')
        .select(`
            *,
            user:profiles(username, full_name, avatar_url)
        `)
        .in('book_id', books?.map(b => b.id) || [])
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <Link href="/" className="text-blue-900 hover:underline mb-6 inline-block">
                    ← Back to Home
                </Link>

                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h1 className="text-4xl font-bold text-blue-900 mb-2">{authorName}</h1>
                    <p className="text-gray-600">
                        {books?.length || 0} books in our library • {reviews?.length || 0} reviews
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold text-blue-900 mb-6">Books by {authorName}</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {books?.map(book => (
                                <Link 
                                    key={book.id}
                                    href={`/books/${book.id}`}
                                    className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex gap-4"
                                >
                                    {book.cover_url ? (
                                        <img 
                                            src={book.cover_url} 
                                            alt={book.title}
                                            className="w-16 h-20 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">No cover</span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-blue-900">{book.title}</h3>
                                        <p className="text-sm text-gray-600">{book.total_pages || '?'} pages</p>
                                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                            book.status === 'finished' ? 'bg-green-100 text-green-800' :
                                            book.status === 'reading' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {book.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Reviews</h2>
                        <div className="space-y-4">
                            {reviews?.map(review => (
                                <div key={review.id} className="bg-white p-4 rounded-xl shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
                                            {review.user?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{review.user?.full_name || 'Anonymous'}</p>
                                            <div className="flex text-yellow-400 text-xs">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">{review.review_text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}