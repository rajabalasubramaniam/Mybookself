export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mybookself.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/dashboard", "/auth", "/profile/edit"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
