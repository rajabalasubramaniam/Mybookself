"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import ShelfHealth from "../../components/ShelfHealth";
import NextBook from "../../components/NextBook";
import ReadingStreak from "../../components/ReadingStreak";

const STATUS_TABS = [
  ["all", "All"],
  ["currently_reading", "📖 Reading"],
  ["queue", "📚 Unread"],
  ["finished", "✅ Finished"],
];
const STATUS_BADGE = { currently_reading: "bg-amber-500", queue: "bg-blue-700", finished: "bg-green-600" };

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [shelf, setShelf] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("grid");
  const [openId, setOpenId] = useState(null);
  const [showInsights, setShowInsights] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadBooks(); }, []);

  const loadBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: booksData } = await supabase.from('books').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setBooks(booksData || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReadingStatus = async (bookId, newStatus) => {
    const now = new Date().toISOString();
    const updates = {
      reading_status: newStatus,
      status: newStatus === 'finished' ? 'finished' : newStatus === 'currently_reading' ? 'reading' : 'unread',
      updated_at: now,
    };
    if (newStatus === 'currently_reading') updates.started_reading_at = now;
    if (newStatus === 'finished') {
      updates.finished_reading_at = now;
      const current = books.find(b => b.id === bookId);
      if (current?.total_pages) updates.current_page = current.total_pages;
    }
    await supabase.from('books').update(updates).eq('id', bookId);
    loadBooks();
  };

  const updateNotes = async (bookId, notes) => {
    await supabase.from('books').update({ notes, updated_at: new Date().toISOString() }).eq('id', bookId);
    loadBooks();
  };

  const updateReflection = async (bookId, rating, reflection) => {
    await supabase.from('books').update({ user_rating: rating || null, reflection: (reflection || '').trim() || null, updated_at: new Date().toISOString() }).eq('id', bookId);
    loadBooks();
  };

  const updateShelf = async (bookId, shelfData) => {
    const book = books.find(b => b.id === bookId);
    const lent = (shelfData.lent_to || '').trim();
    const updates = {
      shelf_location: (shelfData.shelf_location || '').trim() || null,
      bought_at: (shelfData.bought_at || '').trim() || null,
      lent_to: lent || null,
      lent_on: lent ? (book?.lent_to === lent && book?.lent_on ? book.lent_on : new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('books').update(updates).eq('id', bookId);
    loadBooks();
  };

  const genres = useMemo(() => [...new Set(books.map(b => (b.genre || '').trim()).filter(Boolean))].sort(), [books]);
  const shelves = useMemo(() => [...new Set(books.map(b => (b.shelf_location || '').trim()).filter(Boolean))].sort(), [books]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = books.filter(b =>
      (tab === 'all' || b.reading_status === tab) &&
      (!genre || (b.genre || '').trim() === genre) &&
      (!shelf || (b.shelf_location || '').trim() === shelf) &&
      (!term || `${b.title} ${b.author || ''} ${b.isbn || ''}`.toLowerCase().includes(term))
    );
    const by = {
      recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      title: (a, b) => (a.title || '').localeCompare(b.title || ''),
      author: (a, b) => (a.author || '').localeCompare(b.author || ''),
    }[sort];
    return list.slice().sort(by);
  }, [books, tab, q, genre, shelf, sort]);

  const countFor = (key) => key === 'all' ? books.length : books.filter(b => b.reading_status === key).length;
  const openBook = books.find(b => b.id === openId);

  if (loading) return <div className="text-center py-8">Loading your shelf...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">My Shelf</h1>
          <Link href="/books/add" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">+ Add Books</Link>
        </div>

        {books.length > 0 && (
          <div className="mb-6">
            <button onClick={() => setShowInsights(!showInsights)} className="text-xs text-blue-700 mb-2">{showInsights ? "Hide" : "Show"} shelf health and next book</button>
            {showInsights && (
              <div className="grid md:grid-cols-2 gap-4">
                <NextBook books={books} onStart={updateReadingStatus} />
                <ShelfHealth books={books} />
                <ReadingStreak books={books} onLogged={loadBooks} />
              </div>
            )}
          </div>
        )}

        {books.length > 0 && (
          <div className="bg-white rounded-xl shadow p-3 mb-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 rounded-full text-sm ${tab === key ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {label} ({countFor(key)})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, author or ISBN" className="flex-1 min-w-[180px] border rounded px-3 py-2 text-sm" />
              {genres.length > 0 && (
                <select value={genre} onChange={e => setGenre(e.target.value)} className="border rounded px-2 py-2 text-sm">
                  <option value="">All genres</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
              {shelves.length > 0 && (
                <select value={shelf} onChange={e => setShelf(e.target.value)} className="border rounded px-2 py-2 text-sm">
                  <option value="">All shelves</option>
                  {shelves.map(s => <option key={s} value={s}>📍 {s}</option>)}
                </select>
              )}
              <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded px-2 py-2 text-sm">
                <option value="recent">Newest added</option>
                <option value="oldest">Oldest added</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
              </select>
              <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="border rounded px-3 py-2 text-sm">{view === 'grid' ? '☰ List' : '▦ Covers'}</button>
            </div>
          </div>
        )}

        {books.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 mb-4">Your shelf is empty.</p>
            <Link href="/books/add" className="bg-blue-900 text-white px-6 py-3 rounded-lg">Add Your First Book</Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No books match. Try clearing a filter.</p>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {visible.map(b => (
              <button key={b.id} onClick={() => setOpenId(b.id)} className="text-left group">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow bg-gray-200 group-hover:shadow-lg transition">
                  {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" /> : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-gray-500">{b.title}</div>
                  )}
                  <span className={`absolute top-1 right-1 w-3 h-3 rounded-full border border-white ${STATUS_BADGE[b.reading_status] || 'bg-blue-700'}`} />
                  {b.lent_to && <span className="absolute bottom-1 left-1 bg-amber-100 text-amber-800 text-[10px] px-1 rounded">Lent</span>}
                </div>
                <p className="text-xs font-medium text-gray-800 mt-1 line-clamp-2">{b.title}</p>
                <p className="text-[11px] text-gray-500 truncate">{b.author}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y">
            {visible.map(b => (
              <button key={b.id} onClick={() => setOpenId(b.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50">
                {b.cover_url ? <img src={b.cover_url} alt="" className="w-10 h-14 object-cover rounded" /> : <div className="w-10 h-14 bg-gray-200 rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{b.title}</p>
                  <p className="text-xs text-gray-500 truncate">{b.author}{b.genre ? ` · ${b.genre}` : ''}{b.shelf_location ? ` · 📍 ${b.shelf_location}` : ''}</p>
                </div>
                <span className={`w-3 h-3 rounded-full ${STATUS_BADGE[b.reading_status] || 'bg-blue-700'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {openBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpenId(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <BookCard key={openBook.id} book={openBook} onStatusChange={updateReadingStatus} onNotesUpdate={updateNotes} onShelfUpdate={updateShelf} onReflectionUpdate={updateReflection} />
            <button onClick={() => setOpenId(null)} className="mt-2 w-full bg-white rounded-lg py-2 text-sm text-gray-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Book Card Component
function BookCard({ book, onStatusChange, onNotesUpdate, onShelfUpdate, onReflectionUpdate, showRating = false }) {
  const [rating, setRating] = useState(book.user_rating || 0);
  const [reflection, setReflection] = useState(book.reflection || "");
  const [savedRef, setSavedRef] = useState(false);
  const [showShelf, setShowShelf] = useState(false);
  const [shelf, setShelf] = useState({
    shelf_location: book.shelf_location || "",
    bought_at: book.bought_at || "",
    lent_to: book.lent_to || "",
  });
  const [savingShelf, setSavingShelf] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(book.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveShelf = async () => {
    setSavingShelf(true);
    await onShelfUpdate(book.id, shelf);
    setSavingShelf(false);
    setShowShelf(false);
  };

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
          {book.shelf_location && <p className="text-xs text-gray-500 mt-1">📍 {book.shelf_location}</p>}
          {book.lent_to && <p className="text-xs text-amber-700 mt-1">🤝 Lent to {book.lent_to}</p>}
          
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

          {/* Shelf details */}
          <button
            onClick={() => setShowShelf(!showShelf)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 block"
          >
            📍 Shelf details
          </button>

          {showShelf && (
            <div className="mt-2 space-y-1">
              <input type="text" value={shelf.shelf_location} onChange={(e) => setShelf({ ...shelf, shelf_location: e.target.value })} placeholder="Shelf or room" className="w-full text-xs border rounded p-2" />
              <input type="text" value={shelf.bought_at} onChange={(e) => setShelf({ ...shelf, bought_at: e.target.value })} placeholder="Bought at" className="w-full text-xs border rounded p-2" />
              <input type="text" value={shelf.lent_to} onChange={(e) => setShelf({ ...shelf, lent_to: e.target.value })} placeholder="Lent to (leave empty if at home)" className="w-full text-xs border rounded p-2" />
              <button onClick={handleSaveShelf} disabled={savingShelf} className="text-xs bg-blue-900 text-white px-2 py-1 rounded">
                {savingShelf ? "Saving..." : "Save"}
              </button>
            </div>
          )}

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

          {book.reading_status === 'finished' && onReflectionUpdate && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-green-800">You finished this. How was it?</p>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map(r => (
                  <button key={r} type="button" onClick={() => { setRating(r); setSavedRef(false); }} className={`text-2xl leading-none ${r <= rating ? 'text-yellow-400' : 'text-gray-300'}`} aria-label={`${r} stars`}>★</button>
                ))}
              </div>
              <textarea value={reflection} onChange={(e) => { setReflection(e.target.value); setSavedRef(false); }} rows="2" placeholder="One line to remember this book by..." className="w-full text-xs border rounded p-2 mt-2" />
              <button onClick={async () => { await onReflectionUpdate(book.id, rating, reflection); setSavedRef(true); }} className="mt-1 text-xs bg-green-700 text-white px-2 py-1 rounded">{savedRef ? 'Saved ✓' : 'Save'}</button>
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