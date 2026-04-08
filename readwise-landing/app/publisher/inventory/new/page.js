"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/client";

export default function NewInventoryItem() {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCover, setNewBookCover] = useState("");
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const createNewBook = async () => {
  setAddingBook(true);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: newBook, error } = await supabase
    .from('books')
    .insert({
      title: newBookTitle,
      author: newBookAuthor,
      cover_url: newBookCover,
      user_id: user.id, // creator (publisher)
      status: 'unread',
    })
    .select()
    .single();

  if (error) {
    alert('Error creating book');
  } else {
    // Add to books list and select it
    setBooks([...books, newBook]);
    setBookId(newBook.id);
    setShowNewBookModal(false);
    // reset form
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookCover("");
  }
  setAddingBook(false);
};

  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('id, title, author')
      .order('title');
    setBooks(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('publisher_inventory')
      .insert({
        publisher_id: user.id,
        book_id: bookId,
        quantity: parseInt(quantity) || 0,
        price: price ? parseFloat(price) : null,
      });

    setLoading(false);
    if (error) {
      alert('Error adding item');
    } else {
      router.push('/publisher/inventory');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Inventory Item</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Select Book</label>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Choose a book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} by {book.author}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 text-white px-4 py-2 rounded"
          >
            {loading ? 'Adding...' : 'Add Item'}
          </button>
          <Link
            href="/publisher/inventory"
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}