"use client";
export default function Footer() {
  return (
    <footer className="py-12 bg-forest-900 text-peach-100 text-center">
      <h3 className="font-display text-2xl text-gold-300">MyBookSelf</h3>
      <p className="mt-2 text-peach-200">Know every book you own.</p>
      <p className="mt-4 text-sm">
        <a href="/events" className="text-peach-200 hover:text-white underline">Events</a>
        <span className="mx-3 text-forest-400">|</span>
        <a href="/reviews" className="text-peach-200 hover:text-white underline">Reviews</a>
        <span className="mx-3 text-forest-400">|</span>
        <a href="/privacy" className="text-peach-200 hover:text-white underline">Privacy</a>
        <span className="mx-3 text-forest-400">|</span>
        <a href="/terms" className="text-peach-200 hover:text-white underline">Terms</a>
      </p>
      <p className="mt-4 text-forest-300 text-sm">© {new Date().getFullYear()} MyBookSelf. All rights reserved.</p>
    </footer>
  );
}
