const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export function computeStreak(sessions) {
  const when = (s) => s.session_date || s.created_at;
  const days = new Set(sessions.map((s) => dayKey(when(s))));
  const today = new Date();
  let cur = 0;
  const d = new Date(today);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not logged yet: streak still alive
  while (days.has(dayKey(d))) { cur++; d.setDate(d.getDate() - 1); }
  const sorted = [...days].sort();
  let best = 0, run = 0, prev = null;
  sorted.forEach((k) => {
    const t = new Date(k + "T00:00:00");
    run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  });
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const x = new Date(today); x.setDate(x.getDate() - i);
    week.push({ label: x.toLocaleDateString(undefined, { weekday: "narrow" }), on: days.has(dayKey(x)) });
  }
  const weekAgo = Date.now() - 7 * 86400000;
  const pagesWeek = sessions.filter((s) => new Date(when(s)).getTime() >= weekAgo).reduce((a, s) => a + (s.pages_read || 0), 0);
  return { current: cur, best, week, pagesWeek, loggedToday: days.has(dayKey(today)) };
}
