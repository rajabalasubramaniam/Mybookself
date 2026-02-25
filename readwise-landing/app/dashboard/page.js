import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Dashboard() {
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user || userError) {
        redirect('/auth/login')
    }

    // Get user profile from our profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get user's books
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)

    // Calculate stats
    const totalBooks = books?.length || 0
    const readingBooks = books?.filter(b => b.status === 'reading').length || 0
    const finishedBooks = books?.filter(b => b.status === 'finished').length || 0

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-900">ReadWise</h1>
                    <div className="flex items-center space-x-4">
                        <Link 
                            href="/profile/edit" 
                            className="text-gray-600 hover:text-blue-900"
                        >
                            Edit Profile
                        </Link>
                        <form action="/auth/signout" method="post">
                            <button 
                                type="submit"
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-900">
                        Welcome back, {profile?.full_name || user.email}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Member since {new Date(user.created_at).toLocaleDateString()}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">Your Library</h3>
                        <p className="text-4xl font-bold text-amber-500">{totalBooks}</p>
                        <p className="text-gray-600">books owned</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">Currently Reading</h3>
                        <p className="text-4xl font-bold text-green-600">{readingBooks}</p>
                        <p className="text-gray-600">books in progress</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                        <h3 className="text-xl font-semibold mb-2 text-gray-700">Finished</h3>
                        <p className="text-4xl font-bold text-blue-900">{finishedBooks}</p>
                        <p className="text-gray-600">books completed</p>
                        {profile?.reading_goal > 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                                Goal: {finishedBooks}/{profile.reading_goal} books
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/books/add" 
                          className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-2 border-dashed border-gray-300 hover:border-blue-900">
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">➕ Add New Book</h3>
                        <p className="text-gray-600">Scan or manually add a book to your library</p>
                    </Link>

                    <Link href="/books" 
                          className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">📚 View My Library</h3>
                        <p className="text-gray-600">Browse all your books and track reading progress</p>
                    </Link>
                </div>

                {/* Recent Books */}
                {books && books.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">Recent Books</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            {books.slice(0, 4).map(book => (
                                <div key={book.id} className="bg-white p-4 rounded-xl shadow">
                                    {book.cover_url ? (
                                        <img 
                                            src={book.cover_url} 
                                            alt={book.title}
                                            className="w-full h-40 object-cover rounded-lg mb-2"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                                            <span className="text-gray-400">No cover</span>
                                        </div>
                                    )}
                                    <h3 className="font-semibold truncate">{book.title}</h3>
                                    <p className="text-sm text-gray-600">{book.author || 'Unknown author'}</p>
                                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                        book.status === 'finished' ? 'bg-green-100 text-green-800' :
                                        book.status === 'reading' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {book.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}