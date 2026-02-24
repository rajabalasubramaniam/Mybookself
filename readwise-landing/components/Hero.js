"use client";
import Image from "next/image";
import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section className="pt-28 pb-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight">
            Turn Your Unread Books into Finished Stories
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            The average reader owns 42 unread books. ReadWise helps you track,
            organize, and actually finish them.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="bg-blue-900 text-white px-6 py-3 rounded-xl hover:scale-105 transition">
              Start Your Reading Journey →
            </button>
            <a href="#how" className="text-blue-900 font-semibold">
              See How It Works
            </a>
          </div>

          <p className="mt-4 text-sm text-green-600">
            Join 10,000+ readers who finished their collections
          </p>

          <WaitlistForm />
        </div>

        <div className="relative">
          <Image
            src="/images/hero-mockup.png"
            alt="Book scanner mockup"
            width={500}
            height={600}
            className="rounded-2xl shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
