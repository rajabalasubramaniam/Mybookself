"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function WriterBooks() {
  const [books, setBooks] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('writer_books')
      .select('*')
      .eq('writer_id', user.id)
      .order('created_at', { ascending: false });
    setBooks(data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Books</h1>
      <Link href="/writer/books/new" className="bg-blue-900 text-white px-4 py-2 rounded">Add New Book</Link>
      <div className="mt-6 grid gap-4">
        {books.map(book => (
          <div key={book.id} className="border p-4 rounded flex justify-between">
            <div>
              <h3 className="font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-600">{book.price ? `$${book.price}` : 'Price not set'}</p>
            </div>
            <Link href={`/writer/books/${book.id}/edit`} className="text-blue-900">Edit</Link>
          </div>
        ))}
      </div>
    </div>
  );
}