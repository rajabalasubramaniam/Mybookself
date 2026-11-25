// Picks the next book to read from the books the user already owns.
const norm = (s) => (s || "").trim().toLowerCase();

export function pickNextBooks(books, count = 3) {
  const finished = books.filter((b) => b.reading_status === "finished");
  const queue = books.filter((b) => b.reading_status === "queue");
  if (queue.length === 0) return [];

  const authorLoves = {};
  const genreLoves = {};
  finished.forEach((b) => {
    const w = b.user_rating ? b.user_rating / 3 : 1;
    if (b.author) authorLoves[norm(b.author)] = (authorLoves[norm(b.author)] || 0) + w;
    if (b.genre) genreLoves[norm(b.genre)] = (genreLoves[norm(b.genre)] || 0) + w;
  });

  const now = Date.now();
  const scored = queue.map((b) => {
    let score = 0;
    const reasons = [];
    const a = authorLoves[norm(b.author)];
    const g = genreLoves[norm(b.genre)];
    if (a) { score += 3 + a; reasons.push(`You finished another book by ${b.author}`); }
    if (g) { score += 2 + g; reasons.push(`You enjoy ${b.genre}`); }
    const days = Math.floor((now - new Date(b.created_at || now).getTime()) / 86400000);
    if (days >= 30) { score += Math.min(days / 30, 6); reasons.push(`Waiting on your shelf for ${days >= 60 ? Math.floor(days / 30) + " months" : days + " days"}`); }
    if (b.total_pages && b.total_pages <= 250) { score += 1; reasons.push("A quick read"); }
    if (reasons.length === 0) reasons.push("Next in your queue");
    return { book: b, score, reasons };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, count);
}

export function shelfHealth(books) {
  const total = books.length;
  const finished = books.filter((b) => b.reading_status === "finished");
  const reading = books.filter((b) => b.reading_status === "currently_reading");
  const queue = books.filter((b) => b.reading_status === "queue");
  const now = Date.now();
  const d30 = now - 30 * 86400000;
  const added30 = books.filter((b) => new Date(b.created_at).getTime() >= d30).length;
  const finished30 = finished.filter((b) => b.finished_reading_at && new Date(b.finished_reading_at).getTime() >= d30).length;
  const oldest = queue.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0] || null;
  const top = (key) => {
    const m = {};
    books.forEach((b) => { const v = (b[key] || "").trim(); if (v) m[v] = (m[v] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
  };
  const readPct = total ? Math.round((finished.length / total) * 100) : 0;
  let message = "Add your first books to see your shelf health.";
  if (total) {
    if (added30 > finished30 + 2) message = "Your shelf is growing faster than you read. Pick one from the queue this week.";
    else if (readPct >= 60) message = "Wonderful. You read most of what you own.";
    else message = "A healthy shelf: keep going, one book at a time.";
  }
  return { total, finished: finished.length, reading: reading.length, queue: queue.length, readPct, added30, finished30, oldest, topGenres: top("genre"), topAuthors: top("author"), message };
}
