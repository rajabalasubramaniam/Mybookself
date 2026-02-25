"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function Header() {
    const [open, setOpen] = useState(false);
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
        <header className="fixed w-full bg-white shadow-sm z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                <Link href="/" className="text-2xl font-bold text-blue-900">
                    ReadWise
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="hover:text-blue-900">Features</a>
                    <a href="#how" className="hover:text-blue-900">How It Works</a>
                    <a href="#pricing" className="hover:text-blue-900">Pricing</a>
                    
                    {user ? (
                        <Link 
                            href="/dashboard" 
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login" className="text-blue-900 hover:underline">
                                Login
                            </Link>
                            <Link 
                                href="/auth/signup" 
                                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden"
                    onClick={() => setOpen(!open)}
                >
                    ☰
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-white px-4 pb-4 space-y-4">
                    <a href="#features" className="block">Features</a>
                    <a href="#how" className="block">How It Works</a>
                    <a href="#pricing" className="block">Pricing</a>
                    {user ? (
                        <Link href="/dashboard" className="block bg-amber-500 text-white px-4 py-2 rounded-lg text-center">
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login" className="block">Login</Link>
                            <Link href="/auth/signup" className="block bg-blue-900 text-white px-4 py-2 rounded-lg text-center">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}