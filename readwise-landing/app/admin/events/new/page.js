"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";

export default function NewEvent() {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_type: "book_launch",
        start_date: "",
        end_date: "",
        location: "",
        is_virtual: false,
        event_url: "",
        image_url: "",
        is_published: false
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('events')
                .insert({
                    ...formData,
                    created_by: user.id,
                    start_date: new Date(formData.start_date).toISOString(),
                    end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
                });

            if (error) throw error;
            
            router.push('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/admin/events" className="text-blue-900 hover:underline mb-4 inline-block">
                ← Back to Events
            </Link>

            <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
                <div>
                    <label className="block text-gray-700 mb-2">Title *</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        rows="4"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Event Type</label>
                        <select
                            value={formData.event_type}
                            onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        >
                            <option value="book_launch">Book Launch</option>
                            <option value="exhibition">Exhibition</option>
                            <option value="author_signing">Author Signing</option>
                            <option value="book_fair">Book Fair</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Virtual Event?</label>
                        <div className="flex items-center h-10">
                            <input
                                type="checkbox"
                                checked={formData.is_virtual}
                                onChange={(e) => setFormData({...formData, is_virtual: e.target.checked})}
                                className="mr-2"
                            />
                            <span>Yes, this is an online event</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Start Date *</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.start_date}
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">End Date</label>
                        <input
                            type="datetime-local"
                            value={formData.end_date}
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 mb-2">Location</label>
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        placeholder="Physical address or 'Online'"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 mb-2">Event URL</label>
                    <input
                        type="url"
                        value={formData.event_url}
                        onChange={(e) => setFormData({...formData, event_url: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-gray-700 mb-2">Image URL</label>
                    <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                            className="mr-2"
                        />
                        <span>Publish immediately</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
}