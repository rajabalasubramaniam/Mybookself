"use client";
export default function Footer() {
  return (
    <footer className="py-12 bg-gray-900 text-white text-center">
      <h3 className="text-xl font-bold">ReadWise</h3>
      <p className="mt-4">Finish What You Started</p>
      <p className="mt-4 text-gray-400 text-sm">
        © {new Date().getFullYear()} ReadWise. All rights reserved.
      </p>
    </footer>
  );
}
