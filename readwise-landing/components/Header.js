"use client";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-2xl font-bold text-blue-900">
          ReadWise
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-8 items-center">
          <a href="#features" className="hover:text-blue-900">Features</a>
          <a href="#how" className="hover:text-blue-900">How It Works</a>
          <a href="#pricing" className="hover:text-blue-900">Pricing</a>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
            Login
          </button>
        </nav>

        {/* Mobile */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white px-4 pb-4 space-y-4">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <button className="block w-full bg-amber-500 text-white py-2 rounded-lg">
            Login
          </button>
        </div>
      )}
    </header>
  );
}
