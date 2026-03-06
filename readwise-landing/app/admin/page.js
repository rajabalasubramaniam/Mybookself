"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import Link from "next/link";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        totalEvents: 0,
        pendingReviews: 0,
        activeExchanges: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [
                { count: books },
                { count: users },
                { count: events },
                { count: reviews },
                { count: exchanges }
            ] = await Promise.all([
                supabase.from('books').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('user_reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
                supabase.from('book_exchanges').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            setStats({
                totalBooks: books || 0,
                totalUsers: users || 0,
                totalEvents: events || 0,
                pendingReviews: reviews || 0,
                activeExchanges: exchanges || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: "Total Books", value: stats.totalBooks, icon: "📚", color: "bg-blue-500", link: "/admin/books" },
        { title: "Total Users", value: stats.totalUsers, icon: "👥", color: "bg-green-500", link: "/admin/users" },
        { title: "Events", value: stats.totalEvents, icon: "📅", color: "bg-purple-500", link: "/admin/events" },
        { title: "Pending Reviews", value: stats.pendingReviews, icon: "⭐", color: "bg-yellow-500", link: "/admin/reviews" },
        { title: "Active Exchanges", value: stats.activeExchanges, icon: "🔄", color: "bg-red-500", link: "/admin/exchanges" },
    ];

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <Link href={stat.link} key={index}>
                        <div className={`${stat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer`}>
                            <div className="text-4xl mb-2">{stat.icon}</div>
                            <div className="text-lg opacity-90">{stat.title}</div>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/admin/events/new" className="p-4 border rounded-lg hover:bg-blue-50 transition">
                        ➕ Create New Event
                    </Link>
                    <Link href="/admin/trending" className="p-4 border rounded-lg hover:bg-blue-50 transition">
                        🔥 Update Trending Books
                    </Link>
                    <Link href="/admin/reviews/pending" className="p-4 border rounded-lg hover:bg-blue-50 transition">
                        ⭐ Moderate Pending Reviews ({stats.pendingReviews})
                    </Link>
                    <Link href="/admin/exchanges" className="p-4 border rounded-lg hover:bg-blue-50 transition">
                        🔄 Manage Book Exchanges
                    </Link>
                </div>
            </div>
        </div>
    );
}