"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import axios from "axios";
import Notification from "../../../components/Notification";
import Link from "next/link";

// Predefined genre list
const genres = [
  "Fiction",
  "Non-fiction",
  "Mystery",
  "Thriller",
  "Science Fiction",
  "Fantasy",
  "Romance",
  "Biography",
  "History",
  "Self-Help",
  "Poetry",
  "Horror",
  "Adventure",
  "Young Adult",
  "Children's",
  "Other"
];

export default function AddBook() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [manualEntry, setManualEntry] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Manual entry form state
    const [manualBook, setManualBook] = useState({
        title: "",
        author: "",
        isbn: "",
        total_pages: "",
        cover_url: "",
        genre: "",  // NEW: genre field
    });

    const searchBooks = async () => {
        if (!searchQuery.trim()) {
            setError("Please enter a search term");
            return;
        }
        
        setSearching(true);
        setError(null);
        setSearchResults([]);
        
        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
            let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`;
            if (apiKey) url += `&key=${apiKey}`;
            
            const response = await axios.get(url);
            
            if (response.data.items && response.data.items.length > 0) {
                const books = response.data.items.map(item => {
                    const volumeInfo = item.volumeInfo || {};
                    const imageLinks = volumeInfo.imageLinks || {};
                    
                    return {
                        id: item.id,
                        title: volumeInfo.title || "Unknown Title",
                        authors: volumeInfo.authors || ["Unknown Author"],
                        pageCount: volumeInfo.pageCount || 0,
                        coverUrl: imageLinks.thumbnail?.replace('http:', 'https:') || null,
                        isbn: volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier,
                        genre: volumeInfo.categories?.[0] || "",  // auto-detect genre from Google Books
                    };
                });
                setSearchResults(books);
            } else {
                setSearchResults([]);
                setError("No books found. Try a different search term.");
            }
        } catch (err) {
            setError("Failed to search books. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const addBookToLibrary = async (bookData) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const bookToInsert = {
                user_id: user.id,
                title: bookData.title,
                author: bookData.authors ? bookData.authors.join(', ') : bookData.author,
                isbn: bookData.isbn,
                cover_url: bookData.coverUrl || bookData.cover_url,
                total_pages: bookData.pageCount || bookData.total_pages || 0,
                status: 'unread',
                reading_status: 'queue',  // NEW: default reading status
                genre: bookData.genre || null,  // NEW: genre field
                current_page: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('books').insert([bookToInsert]);

            if (error) throw error;

            setSuccess(true);
            setShowNotification(true);
            setTimeout(() => {
                router.push('/books');
            }, 2000);
        } catch (err) {
            console.error('Error adding book:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualBook.title.trim()) {
            setError("Title is required");
            return;
        }
        await addBookToLibrary(manualBook);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {showNotification && (
                    <Notification 
                        message="Book added successfully!" 
                        onClose={() => setShowNotification(false)}
                    />
                )}

                <div className="mb-8">
                    <Link href="/books" className="text-blue-900 hover:underline mb-4 inline-block">
                        ← Back to Library
                    </Link>
                    <h1 className="text-3xl font-bold text-blue-900">Add Books to Your Library</h1>
                    <p className="text-gray-600 mt-2">Search for books or add them manually</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setManualEntry(false)}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                            !manualEntry ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        🔍 Search Books
                    </button>
                    <button
                        onClick={() => setManualEntry(true)}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                            manualEntry ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        📝 Manual Entry
                    </button>
                </div>

                {!manualEntry ? (
                    // Search Mode
                    <>
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                                    placeholder="Search by title, author, or ISBN..."
                                    className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    disabled={searching}
                                />
                                <button
                                    onClick={searchBooks}
                                    disabled={searching || !searchQuery.trim()}
                                    className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {searching ? "Searching..." : "Search"}
                                </button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Found {searchResults.length} books</h2>
                                {searchResults.map((book) => (
                                    <div key={book.id} className="bg-white rounded-xl shadow-lg p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {book.coverUrl && (
                                                <img src={book.coverUrl} alt={book.title} className="w-24 h-32 object-cover rounded-lg" />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-blue-900">{book.title}</h3>
                                                <p className="text-gray-600">by {book.authors.join(', ')}</p>
                                                {book.genre && <p className="text-sm text-gray-500 mt-1">Genre: {book.genre}</p>}
                                                {book.pageCount > 0 && <p className="text-sm text-gray-500">{book.pageCount} pages</p>}
                                            </div>
                                            <button
                                                onClick={() => addBookToLibrary(book)}
                                                disabled={loading}
                                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                                            >
                                                {loading ? "Adding..." : "+ Add to Library"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // Manual Entry Mode
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-blue-900 mb-6">Add Book Manually</h2>
                        <form onSubmit={handleManualSubmit} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={manualBook.title}
                                    onChange={(e) => setManualBook({...manualBook, title: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Author</label>
                                <input
                                    type="text"
                                    value={manualBook.author}
                                    onChange={(e) => setManualBook({...manualBook, author: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                />
                            </div>

                            {/* NEW: Genre Dropdown */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Genre</label>
                                <select
                                    value={manualBook.genre}
                                    onChange={(e) => setManualBook({...manualBook, genre: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                >
                                    <option value="">Select Genre (Optional)</option>
                                    {genres.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">ISBN</label>
                                <input
                                    type="text"
                                    value={manualBook.isbn}
                                    onChange={(e) => setManualBook({...manualBook, isbn: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Total Pages</label>
                                <input
                                    type="number"
                                    value={manualBook.total_pages}
                                    onChange={(e) => setManualBook({...manualBook, total_pages: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Cover Image URL</label>
                                <input
                                    type="url"
                                    value={manualBook.cover_url}
                                    onChange={(e) => setManualBook({...manualBook, cover_url: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {loading ? "Adding..." : "Add Book to Library"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setManualEntry(false)}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}