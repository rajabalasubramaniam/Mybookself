"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        totalBooks: 0,
        totalReviews: 0
    });
    const supabase = createClient();

    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
        try {
            // Get all profiles with user emails from auth
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            // Get emails from auth.users (if possible - may need admin access)
            const enrichedUsers = await Promise.all(profiles.map(async (profile) => {
                // Get user's books count
                const { count: booksCount } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', profile.id);

                // Get user's reviews count
                const { count: reviewsCount } = await supabase
                    .from('user_reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', profile.id);

                // Get last active (from sessions)
                const { data: lastSession } = await supabase
                    .from('reading_sessions')
                    .select('created_at')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...profile,
                    booksCount: booksCount || 0,
                    reviewsCount: reviewsCount || 0,
                    lastActive: lastSession?.[0]?.created_at || profile.created_at
                };
            }));

            setUsers(enrichedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Users active in last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const { data: activeUsers } = await supabase
                .from('reading_sessions')
                .select('user_id')
                .gte('created_at', yesterday.toISOString());

            const { count: totalBooks } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true });

            const { count: totalReviews } = await supabase
                .from('user_reviews')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalUsers: totalUsers || 0,
                activeToday: [...new Set(activeUsers?.map(s => s.user_id) || [])].length,
                totalBooks: totalBooks || 0,
                totalReviews: totalReviews || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const toggleAdmin = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            
            // Update local state
            setUsers(users.map(u => 
                u.id === userId ? { ...u, is_admin: !currentStatus } : u
            ));
        } catch (error) {
            console.error('Error toggling admin:', error);
            alert('Failed to update admin status');
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('⚠️ WARNING: This will delete ALL user data including books, reviews, and sessions. This action cannot be undone!\n\nAre you absolutely sure?')) return;

        try {
            // Delete in correct order due to foreign key constraints
            await supabase.from('reading_sessions').delete().eq('user_id', userId);
            await supabase.from('user_reviews').delete().eq('user_id', userId);
            await supabase.from('books').delete().eq('user_id', userId);
            await supabase.from('profiles').delete().eq('id', userId);
            
            // Note: Cannot delete from auth.users without admin API
            alert('User data deleted. Auth record remains for email uniqueness.');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-900 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-green-600 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Active Today</p>
                    <p className="text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <div className="bg-purple-600 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Total Books</p>
                    <p className="text-2xl font-bold">{stats.totalBooks}</p>
                </div>
                <div className="bg-amber-500 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Total Reviews</p>
                    <p className="text-2xl font-bold">{stats.totalReviews}</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">User</th>
                                <th className="px-6 py-3 text-left">Joined</th>
                                <th className="px-6 py-3 text-center">Books</th>
                                <th className="px-6 py-3 text-center">Reviews</th>
                                <th className="px-6 py-3 text-center">Last Active</th>
                                <th className="px-6 py-3 text-center">Admin</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
                                                {user.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.full_name || 'No name'}</p>
                                                <p className="text-xs text-gray-500">@{user.username || 'no-username'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold">
                                        {user.booksCount}
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold">
                                        {user.reviewsCount}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm">
                                        {new Date(user.lastActive).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                user.is_admin 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}