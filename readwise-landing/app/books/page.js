"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setBooks(booksData || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReadingStatus = async (bookId, newStatus) => {
    const updates = {
      reading_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'currently_reading') {
      updates.started_reading_at = new Date().toISOString();
    }
    if (newStatus === 'finished') {
      updates.finished_reading_at = new Date().toISOString();
      updates.current_page = updates.total_pages; // mark as fully read
    }

    await supabase.from('books').update(updates).eq('id', bookId);
    loadBooks();
  };

  const updateNotes = async (bookId, notes) => {
    await supabase.from('books').update({ notes, updated_at: new Date().toISOString() }).eq('id', bookId);
    loadBooks();
  };

  const currentlyReading = books.filter(b => b.reading_status === 'currently_reading');
  const queueBooks = books.filter(b => b.reading_status === 'queue');
  const finishedBooks = books.filter(b => b.reading_status === 'finished');

  if (loading) {
    return <div className="text-center py-8">Loading your library...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">My Digital Library</h1>
          <Link href="/books/add" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
            + Add Book
          </Link>
        </div>

        {/* Currently Reading Section */}
        {currentlyReading.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-amber-600 mb-4">📖 Currently Reading</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentlyReading.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onStatusChange={updateReadingStatus}
                  onNotesUpdate={updateNotes}
                />
              ))}
            </div>
          </div>
        )}

        {/* Queue Section */}
        {queueBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">📚 Queue / To Read</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queueBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onStatusChange={updateReadingStatus}
                  onNotesUpdate={updateNotes}
                />
              ))}
            </div>
          </div>
        )}

        {/* Finished Section */}
        {finishedBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Finished Books</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finishedBooks.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onStatusChange={updateReadingStatus}
                  onNotesUpdate={updateNotes}
                  showRating={true}
                />
              ))}
            </div>
          </div>
        )}

        {books.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 mb-4">Your library is empty.</p>
            <Link href="/books/add" className="bg-blue-900 text-white px-6 py-3 rounded-lg">
              Add Your First Book
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Book Card Component
function BookCard({ book, onStatusChange, onNotesUpdate, showRating = false }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(book.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onNotesUpdate(book.id, notes);
    setSavingNotes(false);
    setShowNotes(false);
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition">
      <div className="flex">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-24 h-32 object-cover" />
        ) : (
          <div className="w-24 h-32 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No cover</span>
          </div>
        )}
        <div className="flex-1 p-4">
          <h3 className="font-bold text-blue-900">{book.title}</h3>
          <p className="text-sm text-gray-600">{book.author || 'Unknown'}</p>
          {book.genre && <p className="text-xs text-gray-400 mt-1">Genre: {book.genre}</p>}
          
          {/* Status Dropdown */}
          <select
            value={book.reading_status || 'queue'}
            onChange={(e) => onStatusChange(book.id, e.target.value)}
            className="mt-2 text-xs border rounded px-2 py-1"
          >
            <option value="queue">📚 Queue</option>
            <option value="currently_reading">📖 Currently Reading</option>
            <option value="finished">✅ Finished</option>
          </select>

          {/* Notes Button */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 block"
          >
            {book.notes ? "✏️ Edit Note" : "📝 Add Note"}
          </button>

          {showNotes && (
            <div className="mt-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border rounded p-2"
                rows="2"
                placeholder="Your private hints, thoughts, or notes..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-1 text-xs bg-blue-900 text-white px-2 py-1 rounded"
              >
                {savingNotes ? "Saving..." : "Save Note"}
              </button>
            </div>
          )}

          {showRating && !book.user_rating && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Rate this book:</span>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map(r => (
                  <button key={r} className="text-gray-300 hover:text-yellow-400">★</button>
                ))}
              </div>
            </div>
          )}

          <Link href={`/books/${book.id}`} className="mt-3 inline-block text-xs text-blue-900 hover:underline">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}