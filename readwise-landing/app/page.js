import StartButton from "../components/StartButton";
import Footer from "../components/Footer";
import { getHomepageData } from "../lib/homepage";
import TrendingCarousel from "../components/homepage/TrendingCarousel";
import EventsList from "../components/homepage/EventsList";
import RecentReviews from "../components/homepage/RecentReviews";
import ShelfIllustration from "../components/ShelfIllustration";
import Link from "next/link";

const STEPS = [
  ["Scan or search", "Point your phone at the barcode, or type a title. Books you own go onto your shelf in seconds."],
  ["See your shelf", "Know what you own, what you have read, and where each book sits at home."],
  ["Read the next one", "Get a pick from your own unread books, and log a few pages each day."],
];

export default async function Home() {
  const { events, trending, recentReviews, featuredBooks, popularAuthors } = await getHomepageData();

  return (
    <>
      <main>
        {/* Hero */}
        <section className="bg-forest-900 text-peach-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
            <div className="pb-4 md:pb-24 min-w-0">
              <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-peach-50">
                Know every book you own.
              </h1>
              <p className="text-lg md:text-xl text-peach-200 mt-6 max-w-lg leading-relaxed">
                MyBookSelf turns your bookshelf at home into a library you can search, track and finish.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <StartButton className="bg-gold-400 text-forest-900 px-7 py-3.5 rounded-lg font-semibold hover:bg-gold-300 transition" />
                <Link href="#shelf-life" className="border border-peach-200/50 text-peach-100 px-7 py-3.5 rounded-lg font-semibold hover:bg-forest-800 transition">
                  See how it works
                </Link>
              </div>
              <p className="text-sm text-peach-300 mt-5">Free while we grow. Your shelf is private unless you share it.</p>
            </div>
            <ShelfIllustration className="w-full max-w-[520px] mx-auto md:mx-0 md:justify-self-end" />
          </div>
        </section>

        {/* How it works */}
        <section id="shelf-life" className="bg-peach-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h2 className="font-display text-3xl text-forest-900 mb-10 max-w-xl">From the shelf in your room to the last page</h2>
            <ol className="grid md:grid-cols-3 gap-8">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="font-display text-4xl text-gold-500 leading-none">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-lg text-forest-900">{title}</h3>
                    <p className="text-forest-700 mt-1 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trending */}
        {trending.length > 0 && (
          <section id="trending" className="max-w-7xl mx-auto px-4 pt-16">
            <TrendingCarousel books={trending} />
          </section>
        )}

        {/* Community */}
        <section className="max-w-7xl mx-auto px-4 pt-16 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-8">
              <EventsList events={events} />
              {popularAuthors.length > 0 && (
                <div className="bg-white rounded-2xl border border-peach-200 p-6">
                  <h3 className="font-display text-2xl text-forest-900 mb-4">Popular authors</h3>
                  <div className="divide-y divide-peach-200">
                    {popularAuthors.map((author, index) => (
                      <Link key={index} href={`/author/${encodeURIComponent(author.author)}`} className="flex justify-between py-3 hover:text-gold-700 transition">
                        <span className="font-medium text-forest-900">{author.author.trim().replace(/\b([a-z])/g, (m) => m.toUpperCase())}</span>
                        <span className="text-sm text-forest-600">{author.count} {author.count === 1 ? "book" : "books"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <RecentReviews reviews={recentReviews} />
              {featuredBooks.length > 0 && (
                <div>
                  <h3 className="font-display text-2xl text-forest-900 mb-4">New on MyBookSelf</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {featuredBooks.map((book) => (
                      <div key={book.id}>
                        <div className="aspect-[2/3] rounded-md overflow-hidden bg-peach-200 shadow-[3px_3px_0_rgba(18,53,36,.18)]">
                          {book.cover_url ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-forest-700">{book.title}</div>}
                        </div>
                        <p className="text-xs font-medium text-forest-900 mt-2 line-clamp-2">{book.title}</p>
                        <p className="text-[11px] text-forest-600 truncate">{book.author || "Unknown"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-peach-200">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl text-forest-900">Add your first ten books today</h2>
            <p className="text-forest-700 mt-3 mb-8">It takes a few minutes with your phone camera.</p>
            <StartButton className="bg-forest-900 text-peach-50 px-8 py-3.5 rounded-lg font-semibold hover:bg-forest-800 transition inline-block" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
