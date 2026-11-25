"use client";
import { useState } from "react";
import { pickNextBooks } from "../lib/nextBook";

export default function NextBook({ books, onStart }) {
  const [skipped, setSkipped] = useState([]);
  const picks = pickNextBooks(books.filter((b) => !skipped.includes(b.id)), 3);
  if (books.some((b) => b.reading_status === "queue") === false) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-bold text-blue-900">📖 Next Book</h2>
        <p className="text-sm text-gray-600 mt-2">No unread books on your shelf. Add some books to get a pick.</p>
      </div>
    );
  }
  if (picks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-bold text-blue-900">📖 Next Book</h2>
        <button onClick={() => setSkipped([])} className="text-sm text-blue-700 underline mt-2">Show picks again</button>
      </div>
    );
  }
  const [top, ...rest] = picks;
  const b = top.book;
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold text-blue-900 mb-3">📖 Your next book</h2>
      <div className="flex gap-4">
        {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-24 h-36 object-cover rounded" /> : <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">No cover</div>}
        <div className="flex-1">
          <h3 className="font-bold text-blue-900">{b.title}</h3>
          <p className="text-sm text-gray-600">{b.author || "Unknown"}</p>
          {b.shelf_location && <p className="text-xs text-gray-500 mt-1">📍 {b.shelf_location}</p>}
          <ul className="mt-2 text-xs text-gray-600 list-disc ml-4">{top.reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="flex gap-2 mt-3">
            {onStart && <button onClick={() => onStart(b.id, "currently_reading")} className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded">Start reading</button>}
            <button onClick={() => setSkipped([...skipped, b.id])} className="text-sm border px-3 py-1.5 rounded text-gray-600">Not now</button>
          </div>
        </div>
      </div>
      {rest.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Also good:</p>
          <div className="flex gap-3">
            {rest.map((p) => <div key={p.book.id} className="text-xs text-gray-700 flex-1"><b>{p.book.title}</b><br /><span className="text-gray-500">{p.reasons[0]}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
