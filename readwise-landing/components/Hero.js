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
                        Turn Your Unread Books into Finished Stories
                    </h1>
                    <p className="mt-6 text-lg text-gray-600">
                        The average reader owns 42 unread books. ReadWise helps you track,
                        organize, and actually finish them.
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
                                    Start Your Reading Journey →
                                </Link>
                                <a href="#how" className="text-blue-900 font-semibold text-lg">
                                    See How It Works
                                </a>
                            </>
                        )}
                    </div>

                    <p className="mt-4 text-sm text-green-600">
                        Join 10,000+ readers who finished their collections
                    </p>
                </div>

                <HeroImage />
            </div>
        </section>
    );
}