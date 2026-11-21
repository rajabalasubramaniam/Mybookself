import Link from "next/link";

export const metadata = { title: "Privacy Policy - MyBookSelf" };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <article className="max-w-3xl mx-auto px-4 bg-white rounded-xl shadow p-8 text-gray-700 leading-relaxed">
        <Link href="/" className="text-blue-900 hover:underline">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-blue-900 mt-4 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: November 2026</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">What we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account details: name, username, email address and the role you choose (reader, writer or publisher).</li>
          <li>Your library: the books you add, reading status, progress, notes, reviews, goals and challenges.</li>
          <li>Basic usage data such as last login and page visits, to keep the service working and understand how it is used.</li>
        </ul>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">What stays private</h2>
        <p>Your library and notes are private by default. Other members see your shelf only if you switch on "Show my shelf on my public profile" in your profile settings. Your notes and email address are never shown to other members.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">How we use your data</h2>
        <p>To run your account, show your reading statistics, send service emails such as confirmation, and keep the platform safe. We do not sell your personal data.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Services we rely on</h2>
        <p>Your data is stored and processed with Supabase (database and login), Vercel (hosting) and Google Analytics (site usage statistics). Book information is looked up from Open Library.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Your choices</h2>
        <p>You can edit your profile and books at any time. You can ask us to delete your account and all your data{contact ? <> by writing to <a className="text-blue-900 underline" href={`mailto:${contact}`}>{contact}</a></> : " through the contact details on this site"}.</p>

        <h2 className="text-xl font-semibold text-blue-900 mt-6 mb-2">Changes</h2>
        <p>If this policy changes, we will update the date above.</p>
      </article>
    </main>
  );
}
