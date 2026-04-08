"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import HeroImage from "./HeroImage";
import { createClient } from "../lib/supabase/client";

export default function Hero() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <section className="pt-28 pb-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight">
            Welcome to <span className="text-amber-500">ReadWise</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            At ReadWise, we connect passionate book readers with publishers and writers from around the world.
            Our platform promotes great books and encourages readers to develop their reading habits,
            helping them grow into intellectual and insightful individuals.
          </p>
          <p className="mt-4 text-gray-600">
            Whether you're looking for the latest releases, seeking recommendations from renowned authors,
            or simply wanting to explore new genres, ReadWise is your gateway to a world of knowledge and
            imagination. Join our community today and embark on a journey of discovery through the magic of reading.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-blue-900 text-white px-8 py-4 rounded-xl hover:scale-105 transition text-lg font-semibold"
              >
                Go to Your Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="bg-blue-900 text-white px-8 py-4 rounded-xl hover:scale-105 transition text-lg font-semibold"
                >
                  Get Started
                </Link>
                <a
                  href="https://www.youtube.com/watch?v=LXb3EKWsInQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 font-semibold text-lg flex items-center gap-2"
                >
                  <i className="bi bi-play-circle"></i> Watch Video
                </a>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-green-600">
            Join thousands of readers who have transformed their reading journey.
          </p>
        </div>

        <HeroImage />
      </div>
    </section>
  );
}