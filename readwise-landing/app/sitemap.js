export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mybookself.com";
  const now = new Date();
  return ["", "/auth/signup", "/auth/login", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
}
