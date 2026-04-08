"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import { Suspense } from 'react';
import SearchParamsHandler from '../app/components/SearchParamsHandler';

export default function Header() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <header className="fixed w-full bg-white shadow-sm z-50">
            <Suspense fallback={null}>
                <SearchParamsHandler />
            </Suspense>

            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                <Link href="/" className="text-2xl font-bold text-blue-900">
                    ReadWise
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link href="/" className="hover:text-blue-900">Home</Link>
                    <Link href="/books" className="hover:text-blue-900">Library</Link>

                    {user && (
                        <>
                            <Link href="/dashboard" className="hover:text-blue-900">Dashboard</Link>
                            <Link href="/dashboard/statistics" className="hover:text-blue-900">Statistics</Link>
							<Link href="/dashboard/recommendations" className="hover:text-blue-900">Recommendations</Link>
                        </>
                    )}

                    {/* Role-specific links */}
                    {profile?.role === 'writer' && (
                        <Link href="/writer/books" className="hover:text-blue-900">✍️ My Books</Link>
                    )}
                    {profile?.role === 'publisher' && (
                        <Link href="/publisher/inventory" className="hover:text-blue-900">📦 Inventory</Link>
                    )}
                    {profile?.is_admin && (
                        <Link href="/admin" className="hover:text-blue-900">Admin</Link>
                    )}

                    {user ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200">
                                <span className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </span>
                                <span>{profile?.full_name?.split(' ')[0] || 'Profile'}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                                <Link href={`/profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">
                                    My Profile
                                </Link>
                                <Link href="/profile/reader/edit" className="block px-4 py-2 hover:bg-gray-100">
                                    Edit Profile
                                </Link>
                                <hr className="my-1" />
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login" className="hover:text-blue-900">Login</Link>
                            <Link href="/auth/signup" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile menu button */}
                <button className="md:hidden" onClick={() => setOpen(!open)}>
                    ☰
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-white px-4 pb-4 space-y-3 border-t">
                    <Link href="/" className="block py-2">Home</Link>
                    <Link href="/books" className="block py-2">Library</Link>
                    {user && (
                        <>
                            <Link href="/dashboard" className="block py-2">Dashboard</Link>
                            <Link href="/dashboard/statistics" className="block py-2">Statistics</Link>
                        </>
                    )}
                    {profile?.role === 'writer' && <Link href="/writer/books" className="block py-2">✍️ My Books</Link>}
                    {profile?.role === 'publisher' && <Link href="/publisher/inventory" className="block py-2">📦 Inventory</Link>}
                    {profile?.is_admin && <Link href="/admin" className="block py-2">Admin</Link>}
                    {user ? (
                        <>
                            <Link href={`/profile/${user.id}`} className="block py-2">My Profile</Link>
                            <Link href="/profile/reader/edit" className="block py-2">Edit Profile</Link>
                            <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="block py-2">Login</Link>
                            <Link href="/auth/signup" className="block py-2 bg-blue-900 text-white text-center rounded-lg">Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}