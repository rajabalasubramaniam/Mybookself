"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
	const [showActivityModal, setShowActivityModal] = useState(false);
	const [userActivity, setUserActivity] = useState([]);
	const [selectedUserForLogs, setSelectedUserForLogs] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        newToday: 0,
        adminCount: 0,
        bannedCount: 0,
    });

    const supabase = createClient();

    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Enrich with counts and last activity
            const enriched = await Promise.all((profiles || []).map(async (p) => {
                const { count: books } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', p.id);

                const { count: reviews } = await supabase
                    .from('user_reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', p.id);

                const { data: lastSession } = await supabase
                    .from('reading_sessions')
                    .select('created_at')
                    .eq('user_id', p.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...p,
                    booksCount: books || 0,
                    reviewsCount: reviews || 0,
                    lastActive: lastSession?.[0]?.created_at || p.last_login || p.created_at,
                };
            }));

            setUsers(enriched);
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { count: total } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { data: activeSessions } = await supabase
                .from('reading_sessions')
                .select('user_id')
                .gte('created_at', yesterday.toISOString());
            const activeToday = [...new Set(activeSessions?.map(s => s.user_id) || [])].length;

            const { count: newToday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            const { count: adminCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_admin', true);

            const { count: bannedCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_banned', true);

            setStats({ totalUsers: total || 0, activeToday, newToday: newToday || 0, adminCount: adminCount || 0, bannedCount: bannedCount || 0 });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleBanToggle = async (userId, currentBanned) => {
        if (!confirm(`Are you sure you want to ${currentBanned ? 'unban' : 'ban'} this user?`)) return;
        try {
            await supabase
                .from('profiles')
                .update({ is_banned: !currentBanned })
                .eq('id', userId);
            loadUsers();
            loadStats();
        } catch (err) {
            alert('Failed to update ban status');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('⚠️ This will permanently delete ALL user data (books, reviews, etc.). Are you absolutely sure?')) return;
        try {
            // Because of cascade constraints, deleting the auth user removes everything
            await supabase.auth.admin.deleteUser(userId); // Note: requires service_role key – see note below
            loadUsers();
            loadStats();
        } catch (err) {
            alert('Failed to delete user. You may need to use a server-side admin API.');
        }
    };

    // Filter users
    const filtered = users.filter(u => {
        const matchesSearch = 
            (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (roleFilter !== 'all' && u.role !== roleFilter) return false;

        if (statusFilter === 'active') return !u.is_banned;
        if (statusFilter === 'banned') return u.is_banned;
        if (statusFilter === 'admin') return u.is_admin;
        return true;
    });
	
	const loadUserActivity = async (userId) => {
		try {
			const { data } = await supabase
			.from('user_activity_logs')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(50);
		setUserActivity(data || []);
		setSelectedUserForLogs(userId);
		setShowActivityModal(true);
			} catch (error) {
		console.error('Error loading activity:', error);
		}
	};

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent"></div></div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <StatCard title="Total Users" value={stats.totalUsers} color="bg-blue-900" />
                <StatCard title="Active Today" value={stats.activeToday} color="bg-green-600" />
                <StatCard title="New Today" value={stats.newToday} color="bg-purple-600" />
                <StatCard title="Admins" value={stats.adminCount} color="bg-amber-500" />
                <StatCard title="Banned" value={stats.bannedCount} color="bg-red-600" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search name, email, username..."
                    className="flex-1 px-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="px-4 py-2 border rounded-lg" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="reader">Reader</option>
                    <option value="writer">Writer</option>
                    <option value="publisher">Publisher</option>
                </select>
                <select className="px-4 py-2 border rounded-lg" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">User</th>
                            <th className="px-6 py-3 text-left">Email</th>
                            <th className="px-6 py-3 text-left">Role</th>
                            <th className="px-6 py-3 text-center">Books</th>
                            <th className="px-6 py-3 text-center">Reviews</th>
                            <th className="px-6 py-3 text-left">Last Active</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => (
                            <tr key={user.id} className="border-t hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-900">
                                            {user.full_name?.charAt(0) || '?'}
                                        </div>
                                        <span className="font-medium">{user.full_name || 'No name'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{user.email || '—'}</td>
                                <td className="px-6 py-4 capitalize">{user.role || 'reader'}</td>
                                <td className="px-6 py-4 text-center">{user.booksCount}</td>
                                <td className="px-6 py-4 text-center">{user.reviewsCount}</td>
                                <td className="px-6 py-4 text-sm">{new Date(user.lastActive).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                        {user.is_admin && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">Admin</span>}
                                        {user.is_banned ? 
                                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">Banned</span> :
                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Active</span>
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit"
                                        >✏️</button>
                                        <Link href={`/profile/${user.id}`} target="_blank" className="text-green-600 hover:text-green-800" title="View profile">👁️</Link>
                                        <button
                                            onClick={() => handleBanToggle(user.id, user.is_banned)}
                                            className={user.is_banned ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}
                                            title={user.is_banned ? 'Unban' : 'Ban'}
                                        >{user.is_banned ? '🔓' : '🔒'}</button>
										<button
											onClick={() => loadUserActivity(user.id)}
											className="text-blue-600 hover:text-blue-800"
											title="Activity Logs"
										>📋</button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete"
                                        >🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <EditUserModal user={selectedUser} onClose={() => setShowEditModal(false)} onSave={loadUsers} />
            )}
			
			{showActivityModal && (
				<ActivityModal
				activities={userActivity}
			onClose={() => setShowActivityModal(false)}
			/>
			)}
        </div>
    );
}
function ActivityModal({ activities, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">User Activity Log</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500">No activity logged yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="border-b pb-2">
                <p className="font-medium">{act.action}</p>
                <p className="text-xs text-gray-500">
                  {new Date(act.created_at).toLocaleString()}
                </p>
                {act.ip_address && (
                  <p className="text-xs text-gray-400">IP: {act.ip_address}</p>
                )}
              </div>
            ))}
          </div>
        )}
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

function StatCard({ title, value, color }) {
    return (
        <div className={`${color} text-white p-4 rounded-lg shadow`}>
            <div className="text-sm opacity-90">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

function EditUserModal({ user, onClose, onSave }) {
    const [form, setForm] = useState({
        full_name: user.full_name || '',
        username: user.username || '',
        role: user.role || 'reader',
        is_admin: user.is_admin || false,
        is_banned: user.is_banned || false,
        notes: user.notes || '',
    });
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await supabase
                .from('profiles')
                .update(form)
                .eq('id', user.id);
            onSave();
            onClose();
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Edit User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                    <select className="w-full border rounded-lg px-3 py-2" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        <option value="reader">Reader</option>
                        <option value="writer">Writer</option>
                        <option value="publisher">Publisher</option>
                    </select>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_admin} onChange={e => setForm({...form, is_admin: e.target.checked})} /> Admin</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_banned} onChange={e => setForm({...form, is_banned: e.target.checked})} /> Banned</label>
                    </div>
                    <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Admin notes" rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex-1">Save</button>
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}