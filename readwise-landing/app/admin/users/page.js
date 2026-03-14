"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [userActivity, setUserActivity] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        bannedUsers: 0,
        adminUsers: 0,
        newToday: 0
    });

    const supabase = createClient();

    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
    try {
        setLoading(true);
        
        console.log('🔍 Fetching all profiles...');
        
        // Get ALL profiles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log('✅ Raw profiles from DB:', profiles);
        console.log('📊 Total profiles count:', profiles?.length);

        if (!profiles || profiles.length === 0) {
            console.warn('⚠️ No profiles found');
            setUsers([]);
            setLoading(false);
            return;
        }

        // Map without any filtering
        const enrichedUsers = profiles.map(profile => ({
            ...profile,
            booksCount: 0,
            reviewsCount: 0,
            lastActive: profile.last_login || profile.created_at
        }));

        console.log('✨ Enriched users:', enrichedUsers);
        console.log('🎯 Final count:', enrichedUsers.length);

        setUsers(enrichedUsers);
    } catch (error) {
        console.error('❌ Error in loadUsers:', error);
    } finally {
        setLoading(false);
    }
};

    const loadStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: bannedUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_banned', true);

            const { count: adminUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_admin', true);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const { data: activeSessions } = await supabase
                .from('reading_sessions')
                .select('user_id')
                .gte('created_at', yesterday.toISOString());

            const activeToday = [...new Set(activeSessions?.map(s => s.user_id) || [])].length;

            const { count: newToday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            setStats({
                totalUsers: totalUsers || 0,
                activeToday,
                bannedUsers: bannedUsers || 0,
                adminUsers: adminUsers || 0,
                newToday: newToday || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Filter users
    const filteredUsers = users;

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-900 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-green-600 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Active Today</p>
                    <p className="text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <div className="bg-purple-600 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">New Today</p>
                    <p className="text-2xl font-bold">{stats.newToday}</p>
                </div>
                <div className="bg-amber-500 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Admins</p>
                    <p className="text-2xl font-bold">{stats.adminUsers}</p>
                </div>
                <div className="bg-red-600 text-white p-4 rounded-xl shadow">
                    <p className="text-sm opacity-90">Banned</p>
                    <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                </div>
            </div>

            {/* Debug Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Database Status</h3>
                <p>Total users in database: <span className="font-bold">{users.length}</span></p>
                <p>Users with email: <span className="font-bold">{users.filter(u => u.email).length}</span></p>
                <button
                    onClick={() => console.log('All users:', users)}
                    className="text-sm text-blue-600 underline mt-2"
                >
                    Log users to console
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
                            <option value="admin">Admins</option>
                        </select>
						
						<select
							value={filterRole}
							onChange={(e) => setFilterRole(e.target.value)}
							className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
						>
							<option value="all">All Roles</option>
							<option value="reader">Reader</option>
							<option value="writer">Writer</option>
							<option value="publisher">Publisher</option>
						</select>
						
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
								<th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">User</th>
                                <th className="px-6 py-3 text-left">Email</th>
									<td className="px-6 py-4">
										<span className={`px-2 py-1 rounded-full text-xs ${
										user.role === 'writer' ? 'bg-purple-100 text-purple-800' :
										user.role === 'publisher' ? 'bg-orange-100 text-orange-800' :
										'bg-green-100 text-green-800'
										}`}>
										{user.role || 'reader'}
										</span>
									</td>
								
                                <th className="px-6 py-3 text-center">Books</th>
                                <th className="px-6 py-3 text-center">Reviews</th>
                                <th className="px-6 py-3 text-center">Last Active</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
                                                {user.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.full_name || 'No name'}</p>
                                                <p className="text-xs text-gray-500">@{user.username || 'no-username'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {user.email || 'No email'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.booksCount}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.reviewsCount}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm">
                                        {new Date(user.lastActive).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.is_admin && (
                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs mr-1">
                                                Admin
                                            </span>
                                        )}
                                        {user.is_banned ? (
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                                Banned
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button className="text-blue-600 hover:text-blue-800">✏️</button>
                                            <button className="text-green-600 hover:text-green-800">📋</button>
                                            <button className="text-orange-600 hover:text-orange-800">🔒</button>
                                            <button className="text-red-600 hover:text-red-800">🗑️</button>
                                        </div>
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