"use client";
import { shelfHealth } from "../lib/nextBook";

export default function ShelfHealth({ books }) {
  const h = shelfHealth(books);
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-blue-900">🩺 Shelf Health</h2>
        <span className="text-sm text-gray-500">{h.total} books owned</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="bg-green-600 h-3" style={{ width: `${h.readPct}%` }} />
      </div>
      <p className="text-sm text-gray-700 mt-2"><b>{h.readPct}%</b> of your shelf is read ({h.finished} of {h.total})</p>
      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        <div className="bg-amber-50 rounded p-2"><div className="text-xl font-bold text-amber-600">{h.reading}</div><div className="text-xs text-gray-500">Reading</div></div>
        <div className="bg-blue-50 rounded p-2"><div className="text-xl font-bold text-blue-800">{h.queue}</div><div className="text-xs text-gray-500">Unread</div></div>
        <div className="bg-green-50 rounded p-2"><div className="text-xl font-bold text-green-700">{h.finished}</div><div className="text-xs text-gray-500">Finished</div></div>
      </div>
      <p className="text-xs text-gray-500 mt-3">Last 30 days: {h.added30} added, {h.finished30} finished</p>
      {h.oldest && <p className="text-xs text-gray-500 mt-1">Longest waiting: <b>{h.oldest.title}</b></p>}
      {h.topGenres.length > 0 && <p className="text-xs text-gray-500 mt-1">Top genres: {h.topGenres.map(([g, n]) => `${g} (${n})`).join(", ")}</p>}
      <p className="text-sm text-blue-900 mt-3 font-medium">{h.message}</p>
    </div>
  );
}
