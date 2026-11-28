"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { computeStreak } from "../lib/streak";

export default function ReadingStreak({ books, onLogged }) {
  const supabase = createClient();
  const [sessions, setSessions] = useState([]);
  const [bookId, setBookId] = useState("");
  const [pages, setPages] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const reading = books.filter((b) => b.reading_status === "currently_reading");

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const since = new Date(Date.now() - 400 * 86400000).toISOString();
    const { data } = await supabase.from("reading_sessions").select("session_date, created_at, pages_read").eq("user_id", user.id).gte("created_at", since);
    setSessions(data || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!bookId && reading[0]) setBookId(reading[0].id); }, [books]);

  const s = computeStreak(sessions);

  const log = async () => {
    const n = parseInt(pages);
    const b = reading.find((x) => x.id === bookId);
    if (!b || !n || n < 1) return;
    setBusy(true); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    const newPage = (b.current_page || 0) + n;
    const done = b.total_pages && newPage >= b.total_pages;
    const now = new Date().toISOString();
    const upd = { current_page: done ? b.total_pages : newPage, updated_at: now };
    if (done) { upd.reading_status = "finished"; upd.status = "finished"; upd.finished_reading_at = now; }
    const e1 = (await supabase.from("books").update(upd).eq("id", b.id)).error;
    const e2 = (await supabase.from("reading_sessions").insert({ book_id: b.id, user_id: user.id, pages_read: n })).error;
    setBusy(false);
    if (e1 || e2) { setMsg("Could not save. Try again."); return; }
    setPages("");
    setMsg(done ? `You finished ${b.title}! Open it on your shelf to rate it.` : "Logged. Nice work.");
    load();
    onLogged && onLogged();
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-blue-900">🔥 Reading streak</h2>
        <span className="text-sm text-gray-500">Best: {s.best} {s.best === 1 ? "day" : "days"}</span>
      </div>
      <div className="flex items-end gap-4">
        <div><span className="text-4xl font-bold text-amber-600">{s.current}</span><span className="text-sm text-gray-500 ml-1">{s.current === 1 ? "day" : "days"} in a row</span></div>
        <div className="flex gap-1 ml-auto">
          {s.week.map((d, i) => (
            <div key={i} className="text-center"><div className={`w-5 h-5 rounded ${d.on ? "bg-green-600" : "bg-gray-200"}`} /><div className="text-[10px] text-gray-400">{d.label}</div></div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{s.pagesWeek} pages in the last 7 days. {s.loggedToday ? "You read today." : "Read a little today to keep it going."}</p>
      {reading.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-3">
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[140px]">
            {reading.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <input type="number" min="1" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="Pages" className="border rounded px-2 py-1.5 text-sm w-20" />
          <button onClick={log} disabled={busy} className="bg-blue-900 text-white text-sm px-3 py-1.5 rounded">{busy ? "..." : "Log reading"}</button>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-3">Start a book (set it to Reading) to log pages here.</p>
      )}
      {msg && <p className="text-xs text-green-700 mt-2">{msg}</p>}
    </div>
  );
}
