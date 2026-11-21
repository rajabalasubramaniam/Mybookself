import Link from "next/link";

export const metadata = { title: "Terms of Use - MyBookSelf" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <article className="max-w-3xl mx-auto px-4 bg-white rounded-xl shadow p-8 text-gray-700 leading-relaxed">
        <Link href="/" className="text-blue-900 hover:underline">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-blue-900 mt-4 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: November 2026</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Using MyBookSelf</h2>
        <p>MyBookSelf helps readers catalogue and read the books they own, and lets writers and publishers present their work. You must give accurate details and keep your login secure.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Your content</h2>
        <p>You own what you post. By posting reviews, posts or listings you allow us to display them on the platform. Do not post anything unlawful, abusive, misleading or that infringes someone else's rights. We may remove content and suspend accounts that break these rules.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Approval</h2>
        <p>New accounts, writer and publisher pages, reviews and events may need approval before they appear publicly.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Buying and selling</h2>
        <p>Where books are offered through MyBookSelf, the seller is responsible for the book, delivery and returns. MyBookSelf may charge sellers a commission or listing fee, which will be shown before it applies.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Service</h2>
        <p>The service is provided as is while we are growing, and it may change or be unavailable at times. To the extent allowed by law, we are not liable for indirect losses.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Privacy</h2>
        <p>See our <Link href="/privacy" className="text-blue-900 underline">Privacy Policy</Link> for how we handle your data.</p>
      </article>
    </main>
  );
}
