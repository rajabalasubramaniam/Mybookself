"use client";
export default function Footer() {
  return (
    <footer className="py-12 bg-gray-900 text-white text-center">
      <h3 className="text-xl font-bold">MyBookSelf</h3>
      <p className="mt-4">Know the library you own</p>
      <p className="mt-4 text-sm">
        <a href="/privacy" className="text-gray-300 hover:text-white underline">Privacy</a>
        <span className="mx-3 text-gray-600">|</span>
        <a href="/terms" className="text-gray-300 hover:text-white underline">Terms</a>
      </p>
      <p className="mt-4 text-gray-400 text-sm">
        © {new Date().getFullYear()} MyBookSelf. All rights reserved.
      </p>
    </footer>
  );
}
