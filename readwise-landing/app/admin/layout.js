"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: "📊" },
        { name: "Events", href: "/admin/events", icon: "📅" },
        { name: "Trending Books", href: "/admin/trending", icon: "🔥" },
        { name: "Reviews", href: "/admin/reviews", icon: "⭐" },
        { name: "Exchanges", href: "/admin/exchanges", icon: "🔄" },
        { name: "Users", href: "/admin/users", icon: "👥" },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-lg min-h-screen">
                    <div className="p-4">
                        <h1 className="text-2xl font-bold text-blue-900">Admin Panel</h1>
                        <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                    </div>
                    <nav className="mt-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition ${
                                    pathname === item.href ? 'bg-blue-50 text-blue-900 border-r-4 border-blue-900' : ''
                                }`}
                            >
                                <span className="mr-3 text-xl">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}