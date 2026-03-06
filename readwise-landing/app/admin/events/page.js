"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: false });
            setEvents(data || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_published: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            loadEvents();
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const deleteEvent = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Events</h1>
                <Link 
                    href="/admin/events/new"
                    className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                >
                    + Create Event
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">Title</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Start Date</th>
                            <th className="px-6 py-3 text-left">Location</th>
                            <th className="px-6 py-3 text-center">Published</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event) => (
                            <tr key={event.id} className="border-t hover:bg-gray-50">
                                <td className="px-6 py-4">{event.title}</td>
                                <td className="px-6 py-4 capitalize">{event.event_type?.replace('_', ' ')}</td>
                                <td className="px-6 py-4">{new Date(event.start_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{event.location || 'Online'}</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => togglePublish(event.id, event.is_published)}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            event.is_published 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {event.is_published ? 'Published' : 'Draft'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Link 
                                        href={`/admin/events/${event.id}`}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteEvent(event.id)}
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
    );
}