"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/client";

export default function EditInventoryItem({ params }) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    Promise.all([fetchBooks(), fetchItem()]);
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('id, title, author')
      .order('title');
    setBooks(data || []);
  };

  const fetchItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('publisher_inventory')
      .select('*')
      .eq('id', params.id)
      .eq('publisher_id', user.id)
      .single();

    if (error || !data) {
      router.push('/publisher/inventory');
      return;
    }

    setBookId(data.book_id);
    setQuantity(data.quantity.toString());
    setPrice(data.price ? data.price.toString() : '');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('publisher_inventory')
      .update({
        book_id: bookId,
        quantity: parseInt(quantity),
        price: price ? parseFloat(price) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('publisher_id', user.id);

    setSaving(false);
    if (error) {
      alert('Error updating item');
    } else {
      router.push('/publisher/inventory');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Inventory Item</h1>
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
            disabled={saving}
            className="bg-blue-900 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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