"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { Suspense } from 'react';
import SearchParamsHandler from '../app/components/SearchParamsHandler';
import NotificationBell from "./NotificationBell";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role, full_name, is_admin')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        getUser();
    }, []);

    // Close the mobile menu after moving to another page
    useEffect(() => { setOpen(false); }, [pathname]);

    // The admin area has its own sidebar
    if (pathname?.startsWith('/admin')) return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const role = profile?.role || 'reader';
    const editHref = `/profile/${['writer', 'publisher'].includes(role) ? role : 'reader'}/edit`;
    const active = (href) => (pathname === href ? 'text-blue-900 font-semibold' : 'hover:text-blue-900');

    return (
        <header className="sticky top-0 w-full bg-white shadow-sm z-50">
            <Suspense fallback={null}>
                <SearchParamsHandler />
            </Suspense>

            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold text-blue-900">
                    MyBookSelf
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    {user ? (
                        <>
                            <Link href="/dashboard" className={active('/dashboard')}>Dashboard</Link>
                            <Link href="/books" className={active('/books')}>My Shelf</Link>
                            <Link href="/dashboard/statistics" className={active('/dashboard/statistics')}>Insights</Link>
                            <Link href="/dashboard/recommendations" className={active('/dashboard/recommendations')}>Next Book</Link>
                            <Link href="/books/add" className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-medium">
                                + Add Books
                            </Link>
                            <NotificationBell />
                            {role === 'writer' && (
                                <Link href="/writer/books" className="hover:text-blue-900">✍️ My Books</Link>
                            )}
                            {role === 'publisher' && (
                                <Link href="/publisher/inventory" className="hover:text-blue-900">📦 Inventory</Link>
                            )}
                            {profile?.is_admin && (
                                <Link href="/admin" className="hover:text-blue-900">Admin</Link>
                            )}
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
                                <div className="absolute right-0 pt-2 w-48 hidden group-hover:block z-50">
                                    <div className="bg-white rounded-lg shadow-lg py-2">
                                        <Link href={`/profile/${user.id}`} className="block px-4 py-2 hover:bg-gray-100">My Profile</Link>
                                        <Link href={editHref} className="block px-4 py-2 hover:bg-gray-100">Edit Profile</Link>
                                        <Link href="/profile/edit" className="block px-4 py-2 hover:bg-gray-100">Privacy and Goal</Link>
                                        <hr className="my-1" />
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/" className={active('/')}>Home</Link>
                            <Link href="/auth/login" className="hover:text-blue-900">Login</Link>
                            <Link href="/auth/signup" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile menu button */}
                <button className="md:hidden text-2xl px-2" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
                    ☰
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-white px-4 pb-4 space-y-1 border-t">
                    {user ? (
                        <>
                            <Link href="/books/add" className="block py-3 mt-2 bg-amber-500 text-white text-center rounded-lg font-medium">+ Add Books</Link>
                            <Link href="/books/scan" className="block py-2">📷 Scan barcodes</Link>
                            <Link href="/dashboard" className="block py-2">Dashboard</Link>
                            <Link href="/books" className="block py-2">My Shelf</Link>
                            <Link href="/dashboard/statistics" className="block py-2">Insights</Link>
                            <Link href="/dashboard/recommendations" className="block py-2">Next Book</Link>
                            {role === 'writer' && <Link href="/writer/books" className="block py-2">✍️ My Books</Link>}
                            {role === 'publisher' && <Link href="/publisher/inventory" className="block py-2">📦 Inventory</Link>}
                            {profile?.is_admin && <Link href="/admin" className="block py-2">Admin</Link>}
                            <hr className="my-2" />
                            <Link href={`/profile/${user.id}`} className="block py-2">My Profile</Link>
                            <Link href={editHref} className="block py-2">Edit Profile</Link>
                            <Link href="/profile/edit" className="block py-2">Privacy and Goal</Link>
                            <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link href="/" className="block py-2">Home</Link>
                            <Link href="/auth/login" className="block py-2">Login</Link>
                            <Link href="/auth/signup" className="block py-2 bg-blue-900 text-white text-center rounded-lg">Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
