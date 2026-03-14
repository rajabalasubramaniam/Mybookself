"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, active, banned, admin
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
        
        // Get ALL profiles without any filtering
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Total profiles loaded:', profiles?.length);

        // Enrich with activity data
        const enrichedUsers = await Promise.all((profiles || []).map(async (profile) => {
            // Get book count
            const { count: booksCount } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            // Get review count
            const { count: reviewsCount } = await supabase
                .from('user_reviews')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            // Get last activity
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
                lastActive: lastSession?.[0]?.created_at || profile.last_login || profile.created_at,
                displayEmail: profile.email || 'Email not available'
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get counts
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

            // Active in last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const { data: activeSessions } = await supabase
                .from('reading_sessions')
                .select('user_id')
                .gte('created_at', yesterday.toISOString());

            const activeToday = [...new Set(activeSessions?.map(s => s.user_id) || [])].length;

            // New users today
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

    const loadUserActivity = async (userId) => {
        try {
            const { data } = await supabase
                .from('user_activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            setUserActivity(data || []);
            setShowActivityModal(true);
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    };

    const updateUser = async (userData) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: userData.full_name,
                    username: userData.username,
                    is_admin: userData.is_admin,
                    is_banned: userData.is_banned,
                    notes: userData.notes
                })
                .eq('id', userData.id);

            if (error) throw error;

            // Log the action
            await supabase
                .from('user_activity_logs')
                .insert({
                    user_id: userData.id,
                    action: 'profile_updated_by_admin',
                    details: { admin: (await supabase.auth.getUser()).data.user?.id }
                });

            setShowEditModal(false);
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    const toggleBan = async (userId, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            // Log the action
            await supabase
                .from('user_activity_logs')
                .insert({
                    user_id: userId,
                    action: currentStatus ? 'unbanned' : 'banned',
                    details: { admin: (await supabase.auth.getUser()).data.user?.id }
                });

            loadUsers();
        } catch (error) {
            console.error('Error toggling ban:', error);
            alert('Failed to update user status');
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('⚠️ WARNING: This will PERMANENTLY delete all user data including books, reviews, and sessions. This action CANNOT be undone!\n\nAre you absolutely sure?')) return;

        try {
            // Delete in correct order
            await supabase.from('user_activity_logs').delete().eq('user_id', userId);
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

    // Filter users based on search and status
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        switch(filterStatus) {
            case 'active':
                return !user.is_banned;
            case 'banned':
                return user.is_banned === true;
            case 'admin':
                return user.is_admin === true;
            default:
                return true;
        }
    });

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

            {/* Filters and Search */}
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
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">User</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-center">Books</th>
                                <th className="px-6 py-3 text-center">Reviews</th>
                                <th className="px-6 py-3 text-center">Logins</th>
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
                                    <td className="px-6 py-4 text-center">
                                        {user.loginCount}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm">
                                        {new Date(user.lastActive).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {user.is_admin && (
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
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
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => loadUserActivity(user.id)}
                                                className="text-green-600 hover:text-green-800"
                                                title="Activity Log"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => toggleBan(user.id, user.is_banned)}
                                                className={user.is_banned ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}
                                                title={user.is_banned ? 'Unban' : 'Ban'}
                                            >
                                                {user.is_banned ? '🔓' : '🔒'}
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => setShowEditModal(false)}
                    onSave={updateUser}
                />
            )}

            {/* Activity Log Modal */}
            {showActivityModal && (
                <ActivityModal
                    activities={userActivity}
                    onClose={() => setShowActivityModal(false)}
                />
            )}
        </div>
    );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        id: user.id,
        full_name: user.full_name || '',
        username: user.username || '',
        is_admin: user.is_admin || false,
        is_banned: user.is_banned || false,
        notes: user.notes || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Edit User</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_admin}
                                onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                            />
                            <span>Admin User</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_banned}
                                onChange={(e) => setFormData({...formData, is_banned: e.target.checked})}
                            />
                            <span>Banned</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Admin Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg"
                            rows="3"
                            placeholder="Internal notes about this user..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Activity Log Modal Component
function ActivityModal({ activities, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">User Activity Log</h2>
                
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <div key={activity.id} className="border-b pb-2">
                            <div className="flex justify-between">
                                <span className="font-medium">{activity.action}</span>
                                <span className="text-sm text-gray-500">
                                    {new Date(activity.created_at).toLocaleString()}
                                </span>
                            </div>
                            {activity.ip_address && (
                                <p className="text-xs text-gray-400">IP: {activity.ip_address}</p>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    );
}