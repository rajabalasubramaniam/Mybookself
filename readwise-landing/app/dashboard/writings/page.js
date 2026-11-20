"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";

export default function MyWritings() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const supabase = createClient();

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_posts')
                .select(`
                    *,
                    book:books(title, author, cover_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (postId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('user_posts')
                .update({ 
                    is_published: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId);

            if (error) throw error;
            loadPosts();
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post status');
        }
    };

    const updatePost = async (postId) => {
        try {
            const { error } = await supabase
                .from('user_posts')
                .update({ 
                    title: editTitle,
                    content: editContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId);

            if (error) throw error;
            setEditingId(null);
            loadPosts();
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        }
    };

    const deletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('user_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            loadPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-blue-900 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-900">✍️ My Writings</h1>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
                    </span>
                </div>

                {posts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <p className="text-gray-500 mb-4">You haven't written any posts yet.</p>
                        <p className="text-gray-500 mb-6">
                            After finishing a book, you'll be prompted to write about it.
                        </p>
                        <Link href="/books" className="bg-blue-900 text-white px-6 py-3 rounded-lg inline-block">
                            Browse Your Books
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                {/* Book Info Header */}
                                <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-3">
                                    {post.book?.cover_url ? (
                                        <img 
                                            src={post.book.cover_url} 
                                            alt={post.book.title}
                                            className="w-10 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-10 h-12 bg-gray-200 rounded flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">No cover</span>
                                        </div>
                                    )}
                                    <div>
                                        <Link href={`/books/${post.book_id}`} className="font-semibold text-blue-900 hover:underline">
                                            {post.book?.title}
                                        </Link>
                                        <p className="text-sm text-gray-600">by {post.book?.author || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="p-6">
                                    {editingId === post.id ? (
                                        // Edit Mode
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-900"
                                                placeholder="Post Title"
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-900"
                                                rows="6"
                                                placeholder="Your writing..."
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => updatePost(post.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            <div className="flex justify-between items-start mb-3">
                                                <h2 className="text-xl font-bold text-purple-900">{post.title}</h2>
                                                <span className={`px-3 py-1 rounded-full text-xs ${
                                                    post.is_published 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {post.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">
                                                {post.content}
                                            </p>
                                            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-gray-500">
                                                <span>
                                                    Created: {new Date(post.created_at).toLocaleDateString()}
                                                </span>
                                                {post.updated_at !== post.created_at && (
                                                    <span>
                                                        Updated: {new Date(post.updated_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {!editingId || editingId !== post.id ? (
                                    <div className="bg-gray-50 px-6 py-3 border-t flex gap-4">
                                        <button
                                            onClick={() => {
                                                setEditingId(post.id);
                                                setEditTitle(post.title);
                                                setEditContent(post.content);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => togglePublish(post.id, post.is_published)}
                                            className="text-green-600 hover:text-green-800 text-sm"
                                        >
                                            {post.is_published ? '📄 Unpublish' : '📢 Publish'}
                                        </button>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}