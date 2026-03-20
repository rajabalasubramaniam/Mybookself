"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/client";

export default function EditWriterBook({ params }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBook();
  }, []);

  const loadBook = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('writer_books')
        .select('*')
        .eq('id', params.id)
        .eq('writer_id', user.id)
        .single();

      if (error || !data) {
        router.push('/writer/books');
        return;
      }

      setTitle(data.title);
      setDescription(data.description || '');
      setPrice(data.price ? data.price.toString() : '');
      setCoverUrl(data.cover_url || '');
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('writer_books')
      .update({
        title,
        description,
        price: price ? parseFloat(price) : null,
        cover_url: coverUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('writer_id', user.id);

    setSaving(false);
    if (error) {
      alert('Error updating book');
    } else {
      router.push('/writer/books');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Book</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          rows="4"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="url"
          placeholder="Cover Image URL"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-900 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/writer/books"
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}