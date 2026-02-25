"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import axios from "axios";

export default function AddBook() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [manualEntry, setManualEntry] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Manual entry form state
    const [manualBook, setManualBook] = useState({
        title: "",
        author: "",
        isbn: "",
        total_pages: "",
        cover_url: "",
    });

    // Search Google Books with API key
    const searchBooks = async () => {
        if (!searchQuery.trim()) {
            setError("Please enter a search term");
            return;
        }
        
        setSearching(true);
        setError(null);
        setSearchResults([]);
        
        try {
            // Get API key from environment variables
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
            
            // Build URL with or without API key
            let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`;
            if (apiKey) {
                url += `&key=${apiKey}`;
            }
            
            console.log("Searching books with URL:", url.replace(apiKey, "HIDDEN_KEY")); // Debug log
            
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                },
                timeout: 10000, // 10 second timeout
            });
            
            console.log("API Response received:", response.data);
            
            if (response.data.items && response.data.items.length > 0) {
                const books = response.data.items.map(item => {
                    const volumeInfo = item.volumeInfo || {};
                    const imageLinks = volumeInfo.imageLinks || {};
                    
                    // Find ISBN (prefer ISBN-13)
                    const isbnObj = volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13") ||
                                   volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_10");
                    
                    return {
                        id: item.id,
                        title: volumeInfo.title || "Unknown Title",
                        authors: volumeInfo.authors || ["Unknown Author"],
                        publisher: volumeInfo.publisher,
                        publishedDate: volumeInfo.publishedDate,
                        description: volumeInfo.description,
                        pageCount: volumeInfo.pageCount || 0,
                        categories: volumeInfo.categories || [],
                        coverUrl: imageLinks.thumbnail?.replace('http:', 'https:') || 
                                 imageLinks.smallThumbnail?.replace('http:', 'https:') || 
                                 null,
                        isbn: isbnObj?.identifier || null,
                    };
                });
                
                console.log(`Found ${books.length} books`);
                setSearchResults(books);
            } else {
                setSearchResults([]);
                setError("No books found. Try a different search term.");
            }
        } catch (err) {
            console.error("Search error:", err);
            
            // Handle different types of errors
            if (err.code === 'ECONNABORTED') {
                setError("Request timeout. Please check your internet connection.");
            } else if (err.response) {
                // The request was made and the server responded with a status code
                const status = err.response.status;
                const data = err.response.data;
                
                if (status === 403) {
                    setError("API key error or quota exceeded. Please check your Google Books API key.");
                } else if (status === 429) {
                    setError("Too many requests. Please wait a moment and try again.");
                } else {
                    setError(`API Error (${status}): ${data.error?.message || 'Unknown error'}`);
                }
            } else if (err.request) {
                // The request was made but no response was received
                setError("No response from Google Books API. Please check your internet connection.");
            } else {
                setError("Failed to search books. Please try again.");
            }
        } finally {
            setSearching(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchBooks();
        }
    };

    // Add book to user's library
    const addBookToLibrary = async (bookData) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Prepare book data for insertion
            const bookToInsert = {
                user_id: user.id,
                title: bookData.title,
                author: bookData.authors ? bookData.authors.join(', ') : bookData.author,
                isbn: bookData.isbn,
                cover_url: bookData.coverUrl || bookData.cover_url,
                total_pages: bookData.pageCount || bookData.total_pages || 0,
                status: 'unread',
                current_page: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            console.log("Adding book:", bookToInsert);

            const { error, data } = await supabase
                .from('books')
                .insert([bookToInsert])
                .select();

            if (error) throw error;

            console.log("Book added successfully:", data);
            setSuccess(true);
            
            // Redirect after success
            setTimeout(() => {
                router.push('/books');
            }, 2000);
        } catch (err) {
            console.error("Error adding book:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle manual form submission
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        
        // Validate manual entry
        if (!manualBook.title.trim()) {
            setError("Title is required");
            return;
        }
        
        await addBookToLibrary(manualBook);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-900">Add Books to Your Library</h1>
                    <p className="text-gray-600 mt-2">Search for books or add them manually</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                        ✅ Book added successfully! Redirecting to your library...
                    </div>
                )}

                {/* Toggle between search and manual */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => {
                            setManualEntry(false);
                            setError(null);
                            setSearchResults([]);
                        }}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                            !manualEntry 
                                ? 'bg-blue-900 text-white shadow-lg' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        🔍 Search Books
                    </button>
                    <button
                        onClick={() => {
                            setManualEntry(true);
                            setError(null);
                            setSearchResults([]);
                        }}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                            manualEntry 
                                ? 'bg-blue-900 text-white shadow-lg' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search by title, author, or ISBN (e.g., 'Harry Potter')"
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    disabled={searching}
                                />
                                <button
                                    onClick={searchBooks}
                                    disabled={searching || !searchQuery.trim()}
                                    className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {searching ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Searching...
                                        </span>
                                    ) : "Search"}
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Tip: Try specific titles like "The Hobbit" or authors like "Stephen King"
                            </p>
                        </div>

                        {/* Loading State */}
                        {searching && (
                            <div className="text-center py-12 bg-white rounded-xl shadow">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Searching Google Books...</p>
                            </div>
                        )}

                        {/* No Results */}
                        {!searching && searchResults.length === 0 && searchQuery && (
                            <div className="text-center py-12 bg-white rounded-xl shadow">
                                <p className="text-gray-500 mb-4">No books found for "{searchQuery}"</p>
                                <button
                                    onClick={() => {
                                        setManualEntry(true);
                                        setManualBook({...manualBook, title: searchQuery});
                                    }}
                                    className="text-blue-900 hover:underline"
                                >
                                    Click here to add "{searchQuery}" manually
                                </button>
                            </div>
                        )}

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Found {searchResults.length} books
                                </h2>
                                {searchResults.map((book) => (
                                    <div key={book.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Book Cover */}
                                            <div className="flex-shrink-0">
                                                {book.coverUrl ? (
                                                    <img 
                                                        src={book.coverUrl} 
                                                        alt={book.title}
                                                        className="w-32 h-40 object-cover rounded-lg shadow-md"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://via.placeholder.com/128x192?text=No+Cover";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-32 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                        <span className="text-gray-400 text-sm text-center">No Cover</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Book Details */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-blue-900">{book.title}</h3>
                                                <p className="text-gray-600 mt-1">
                                                    by {book.authors.join(', ')}
                                                </p>
                                                
                                                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                                    {book.pageCount > 0 && (
                                                        <span className="text-gray-500">
                                                            📄 {book.pageCount} pages
                                                        </span>
                                                    )}
                                                    {book.isbn && (
                                                        <span className="text-gray-500">
                                                            📚 ISBN: {book.isbn}
                                                        </span>
                                                    )}
                                                    {book.publishedDate && (
                                                        <span className="text-gray-500">
                                                            📅 {book.publishedDate}
                                                        </span>
                                                    )}
                                                </div>

                                                {book.description && (
                                                    <p className="text-gray-600 mt-3 text-sm line-clamp-3">
                                                        {book.description.replace(/<[^>]*>/g, '')}
                                                    </p>
                                                )}

                                                {book.categories && book.categories.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {book.categories.slice(0, 3).map(category => (
                                                            <span key={category} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                {category}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Button */}
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => addBookToLibrary(book)}
                                                    disabled={loading}
                                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap font-medium"
                                                >
                                                    {loading ? "Adding..." : "+ Add to Library"}
                                                </button>
                                            </div>
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
                                <label className="block text-gray-700 font-medium mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={manualBook.title}
                                    onChange={(e) => setManualBook({...manualBook, title: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    placeholder="Enter book title"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Author</label>
                                <input
                                    type="text"
                                    value={manualBook.author}
                                    onChange={(e) => setManualBook({...manualBook, author: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    placeholder="Enter author name"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">ISBN</label>
                                <input
                                    type="text"
                                    value={manualBook.isbn}
                                    onChange={(e) => setManualBook({...manualBook, isbn: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    placeholder="Enter ISBN (optional)"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Total Pages</label>
                                <input
                                    type="number"
                                    value={manualBook.total_pages}
                                    onChange={(e) => setManualBook({...manualBook, total_pages: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    placeholder="Number of pages"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Cover Image URL</label>
                                <input
                                    type="url"
                                    value={manualBook.cover_url}
                                    onChange={(e) => setManualBook({...manualBook, cover_url: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    placeholder="https://..."
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Optional: Enter a URL for the book cover image
                                </p>
                            </div>

                            {manualBook.cover_url && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">Cover Preview:</p>
                                    <img 
                                        src={manualBook.cover_url} 
                                        alt="Cover preview"
                                        className="w-24 h-32 object-cover rounded-lg shadow"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/96x128?text=Invalid+URL";
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !manualBook.title.trim()}
                                    className="flex-1 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 font-medium"
                                >
                                    {loading ? "Adding..." : "Add Book to Library"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setManualEntry(false)}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
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