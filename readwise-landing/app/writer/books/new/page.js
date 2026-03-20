"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";

export default function NewWriterBook() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('writer_books')
      .insert({
        writer_id: user.id,
        title,
        description,
        price: price ? parseFloat(price) : null,
        cover_url: coverUrl,
      });

    setLoading(false);
    if (error) {
      alert('Error adding book');
    } else {
      router.push('/writer/books');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Book</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" rows="4" />
        <input type="number" step="0.01" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded" />
        <input type="url" placeholder="Cover Image URL" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full border p-2 rounded" />
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="bg-blue-900 text-white px-4 py-2 rounded">Save</button>
          <Link href="/writer/books" className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</Link>
        </div>
      </form>
    </div>
  );
}