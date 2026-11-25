// Maps Open Library subjects to a simple genre list.
const RULES = [
  ["Fantasy", /fantasy|magic|dragons/],
  ["Science Fiction", /science fiction|sci-fi|dystopi/],
  ["Mystery", /mystery|thriller|detective|crime|suspense/],
  ["Romance", /romance|love stories/],
  ["Horror", /horror|ghost/],
  ["Biography", /biograph|memoir|autobiograph/],
  ["History", /history|historical/],
  ["Self-Help", /self-help|self help|personal development|motivation|success/],
  ["Non-fiction", /business|economics|finance|management|entrepreneur/],
  ["Non-fiction", /science|physics|biology|nature|mathematics/],
  ["Non-fiction", /philosoph/],
  ["Non-fiction", /religion|spiritual|hindu|buddh|bible|yoga/],
  ["Poetry", /poetry|poems/],
  ["Children's", /juvenile|children|picture book/],
  ["Fiction", /fiction|novel|stories/],
];
export function guessGenre(subjects) {
  const text = (Array.isArray(subjects) ? subjects : [subjects]).map((s) => (typeof s === "string" ? s : s?.name || "")).join(" | ").toLowerCase();
  for (const [g, re] of RULES) if (re.test(text)) return g;
  return "";
}
export const GENRES = ["Fiction","Non-fiction","Mystery","Thriller","Science Fiction","Fantasy","Romance","Biography","History","Self-Help","Poetry","Horror","Adventure","Young Adult","Children's","Other"];
