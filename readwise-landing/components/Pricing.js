"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function Pricing() {
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
        <section id="pricing" className="py-20 bg-blue-50 text-center">
            <h2 className="text-3xl font-bold text-blue-900">
                Simple, Transparent Pricing
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
                <div className="p-8 bg-white rounded-2xl shadow hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold text-blue-900">Free</h3>
                    <p className="mt-4 text-gray-600">Basic tracking, 1 accountability circle</p>
                    {!user && (
                        <Link href="/auth/signup" className="mt-6 inline-block bg-blue-900 text-white px-6 py-2 rounded-lg">
                            Start Free
                        </Link>
                    )}
                </div>

                <div className="p-8 bg-white rounded-2xl shadow-xl border-2 border-amber-500 transform scale-105">
                    <h3 className="text-xl font-semibold text-blue-900">Premium</h3>
                    <p className="text-2xl font-bold text-amber-500">$3/month</p>
                    <p className="mt-4 text-gray-600">Unlimited circles, insights, AI reading coach</p>
                </div>

                <div className="p-8 bg-white rounded-2xl shadow hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold text-blue-900">Annual</h3>
                    <p className="text-2xl font-bold text-green-600">$30/year</p>
                    <p className="mt-4 text-gray-600">2 months free</p>
                </div>
            </div>

            <p className="mt-8 text-green-600 font-semibold">
                No credit card required to start
            </p>
        </section>
    );
}