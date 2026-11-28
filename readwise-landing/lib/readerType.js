// Gives a reader a friendly label from their shelf. Needs: genre, reading_status.
export function readerType(books) {
  const total = books.length;
  const finished = books.filter((b) => b.reading_status === "finished").length;
  const genres = {};
  books.forEach((b) => { const g = (b.genre || "").trim(); if (g) genres[g] = (genres[g] || 0) + 1; });
  const ranked = Object.entries(genres).sort((a, b) => b[1] - a[1]);
  const pct = total ? finished / total : 0;
  if (total < 5) return { name: "New shelf", note: "Just getting started." };
  if (ranked.length && ranked[0][1] / total >= 0.5) return { name: `${ranked[0][0]} devotee`, note: `Over half the shelf is ${ranked[0][0]}.` };
  if (ranked.length >= 5) return { name: "Explorer", note: `Reads across ${ranked.length} genres.` };
  if (pct >= 0.6) return { name: "Finisher", note: "Reads most of what they own." };
  if (total >= 15 && pct < 0.3) return { name: "Collector", note: "A big shelf with many stories waiting." };
  return { name: "Steady reader", note: "One book at a time." };
}
export { };
