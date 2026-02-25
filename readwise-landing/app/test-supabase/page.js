"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function TestSupabase() {
    const [status, setStatus] = useState("Loading...");
    const [error, setError] = useState(null);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        async function testConnection() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('count')
                    .limit(1);
                
                if (error) throw error;
                
                setStatus("✅ Supabase connected successfully!");
            } catch (err) {
                setError(err.message);
                setStatus("❌ Connection failed");
            }
        }
        
        testConnection();
    }, [supabase]);

    // Don't render until client-side
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-8 bg-white rounded-xl shadow max-w-md">
                <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
                <pre className="whitespace-pre-wrap font-mono text-sm">
                    {status}
                </pre>
                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
}