"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import Link from "next/link";

export default function EditEvent({ params }) {
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadEvent();
    }, []);

    const loadEvent = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            
            // Format dates for datetime-local input
            setFormData({
                ...data,
                start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : "",
                end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : ""
            });
        } catch (error) {
            console.error('Error loading event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    ...formData,
                    start_date: new Date(formData.start_date).toISOString(),
                    end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
                })
                .eq('id', params.id);

            if (error) throw error;
            
            router.push('/admin/events');
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/admin/events" className="text-blue-900 hover:underline mb-4 inline-block">
                ← Back to Events
            </Link>

            <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
                {/* Same form fields as new event page */}
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
                            <span>Yes</span>
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
                        <span>Published</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}