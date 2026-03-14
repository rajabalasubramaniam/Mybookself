"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

export default function WriterEditProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [twitter, setTwitter] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/auth/login');
                    return;
                }

                // Fetch base profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (profileError) throw profileError;

                // Fetch writer profile
                const { data: writer, error: writerError } = await supabase
                    .from('writer_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
                setBio(writer?.bio || '');
                setWebsite(writer?.website || '');
                // Assuming social_links is JSON with twitter field
                setTwitter(writer?.social_links?.twitter || '');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Update base profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            if (profileError) throw profileError;

            // Upsert writer profile
            const { error: writerError } = await supabase
                .from('writer_profiles')
                .upsert({
                    id: user.id,
                    bio,
                    website,
                    social_links: { twitter },
                }, { onConflict: 'id' });

            if (writerError) throw writerError;

            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow p-8">
                    <h1 className="text-3xl font-bold text-blue-900 mb-8">Edit Writer Profile</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                            Profile updated! Redirecting...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                rows="4"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Website</label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Twitter handle</label>
                            <input
                                type="text"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                placeholder="@username"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <Link
                                href="/dashboard"
                                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}