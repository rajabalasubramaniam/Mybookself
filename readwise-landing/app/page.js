import Header from "../components/Header";
import Footer from "../components/Footer";
import { getHomepageData } from "../lib/homepage";
import TrendingCarousel from "../components/homepage/TrendingCarousel";
import EventsList from "../components/homepage/EventsList";
import RecentReviews from "../components/homepage/RecentReviews";
import Link from "next/link";

export default async function Home() {
    const { events, trending, recentReviews, featuredBooks, popularAuthors } = await getHomepageData();

    return (
        <>
            <Header />
            <main className="bg-gray-50">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 py-20">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl font-bold mb-6">
                                Your Gateway to
                                <span className="text-yellow-400"> Unlimited Reading</span>
                            </h1>
                            <p className="text-xl text-blue-100 mb-8">
                                Track your reading journey, discover new books, connect with authors, 
                                and join a community of book lovers.
                            </p>
                            <div className="flex gap-4">
                                <Link 
                                    href="/auth/signup" 
                                    className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-yellow-300 transition"
                                >
                                    Start Your Journey
                                </Link>
                                <Link 
                                    href="#trending" 
                                    className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition"
                                >
                                    Explore Books
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trending Section */}
                <section id="trending" className="max-w-7xl mx-auto px-4 py-16">
                    <TrendingCarousel books={trending} />
                </section>

                {/* Main Content Grid */}
                <section className="max-w-7xl mx-auto px-4 pb-16">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Events & Authors */}
                        <div className="space-y-8">
                            <EventsList events={events} />
                            
                            {/* Popular Authors */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="text-xl font-bold text-blue-900 mb-4">✍️ Popular Authors</h3>
                                <div className="space-y-3">
                                    {popularAuthors.map((author, index) => (
                                        <Link 
                                            key={index}
                                            href={`/author/${encodeURIComponent(author.author)}`}
                                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <p className="font-semibold text-gray-800">{author.author}</p>
                                            <p className="text-sm text-gray-500">{author.count} books</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Featured Books */}
                        <div className="lg:col-span-2">
                            <RecentReviews reviews={recentReviews} />

                            {/* New Releases */}
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-blue-900 mb-6">📚 New Releases</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {featuredBooks.map((book) => (
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
                                                <h4 className="font-semibold text-blue-900 line-clamp-2">
                                                    {book.title}
                                                </h4>
                                                <p className="text-sm text-gray-600">{book.author || 'Unknown'}</p>
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
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-blue-50 py-16">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl font-bold text-blue-900 mb-4">
                            Ready to Transform Your Reading?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Join thousands of readers who are finally finishing their books
                        </p>
                        <Link 
                            href="/auth/signup" 
                            className="bg-blue-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition inline-block"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}