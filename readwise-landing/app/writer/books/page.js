"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function WriterBooks() {
  const [books, setBooks] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data }, { data: prof }] = await Promise.all([
      supabase.from("writer_books").select("*").eq("writer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, is_approved, full_name").eq("id", user.id).single(),
    ]);
    setBooks(data || []);
    setMe(prof);
    setLoading(false);
  };

  const remove = async (id) => {
    if (!confirm("Delete this book?")) return;
    await supabase.from("writer_books").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="font-display text-3xl text-forest-900">My books</h1>
        <div className="flex gap-2">
          {me && <Link href={`/profile/${me.id}`} className="border border-forest-900 text-forest-900 px-4 py-2 rounded-lg hover:bg-peach-100">View my public page</Link>}
          <Link href="/writer/books/new" className="bg-forest-900 text-peach-50 px-4 py-2 rounded-lg hover:bg-forest-800">Add a book</Link>
        </div>
      </div>

      {me && !me.is_approved && (
        <p className="mb-6 bg-gold-100 text-gold-800 rounded-lg p-3 text-sm">Your writer account is waiting for review. Your page and books become public once it is approved. <Link href="/profile/writer/edit" className="underline">Complete your profile</Link> to help us approve you faster.</p>
      )}

      {books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-peach-200 p-10 text-center">
          <p className="text-forest-700 mb-4">You have not added any books yet.</p>
          <Link href="/writer/books/new" className="bg-gold-400 text-forest-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-300">Add your first book</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {books.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-peach-200 p-4 flex gap-4">
              {b.cover_url ? <img src={b.cover_url} alt="" className="w-20 h-28 object-cover rounded" /> : <div className="w-20 h-28 rounded bg-peach-200" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-forest-900">{b.title}</h3>
                <p className="text-sm text-forest-700">{b.price ? `₹${b.price}` : "Price not set"}</p>
                {b.description && <p className="text-sm text-forest-600 mt-1 line-clamp-2">{b.description}</p>}
                <div className="flex gap-4 mt-2 text-sm">
                  <Link href={`/writer/books/${b.id}/edit`} className="text-forest-800 underline">Edit</Link>
                  <button onClick={() => remove(b.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
