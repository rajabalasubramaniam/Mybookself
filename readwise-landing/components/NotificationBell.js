"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const supabase = createClient();

    useEffect(() => {
        loadNotifications();

        // Set up real-time subscription for new notifications
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${supabase.auth.getUser().then(res => res.data.user?.id)}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            channel.unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);
            
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_follower': return '👥';
            case 'post_published': return '✍️';
            case 'recommendation': return '📖';
            case 'review_received': return '⭐';
            default: return '🔔';
        }
    };

    if (!notifications.length && unreadCount === 0 && !isOpen) {
        return null; // Hide bell if no notifications
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <Link
                                    key={notification.id}
                                    href={notification.link || '#'}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`block p-3 border-b hover:bg-gray-50 transition ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 text-sm">
                                                {notification.title}
                                            </p>
                                            <p className="text-gray-600 text-xs mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}