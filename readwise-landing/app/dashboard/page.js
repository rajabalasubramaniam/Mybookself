"use client";
import Statistics from './Statistics';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import Goals from './Goals';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadDashboard() {
            try {
                // Get user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/auth/login');
                    return;
                }
                setUser(user);

                // Get profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profile);

                // Get books
                const { data: books } = await supabase
                    .from('books')
                    .select('*')
                    .eq('user_id', user.id);
                setBooks(books || []);
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const totalBooks = books.length;
    const readingBooks = books.filter(b => b.status === 'reading').length;
    const finishedBooks = books.filter(b => b.status === 'finished').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-900">ReadWise</Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/profile/edit" className="text-gray-600 hover:text-blue-900">
                            Edit Profile
                        </Link>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/');
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-8">
                    Welcome back, {profile?.full_name || user?.email}!
                </h1>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-xl font-semibold mb-2">Your Library</h3>
                        <p className="text-4xl font-bold text-amber-500">{totalBooks}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-xl font-semibold mb-2">Currently Reading</h3>
                        <p className="text-4xl font-bold text-green-600">{readingBooks}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-xl font-semibold mb-2">Finished</h3>
                        <p className="text-4xl font-bold text-blue-900">{finishedBooks}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/books/add" 
                          className="bg-white p-6 rounded-xl shadow hover:shadow-lg border-2 border-dashed border-gray-300">
                        <h3 className="text-xl font-semibold text-blue-900">➕ Add New Book</h3>
                    </Link>
                    <Link href="/books" 
                          className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
                        <h3 className="text-xl font-semibold text-blue-900">📚 View My Library</h3>
                    </Link>
                </div>
				
				{/* Statistics component */}
				<div className="mt-12">
					<h2 className="text-2xl font-bold text-blue-900 mb-6">📊 Your Reading Statistics</h2>
					<Statistics />
				</div>
				
				{/* Goals component */}
				<div className="mt-12">
					<Goals />
				</div>
				
            </div>
        </div>
    );
}