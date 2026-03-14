"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function ConfirmPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            // Get profile role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            // Redirect based on role
            if (profile?.role === 'writer') {
                router.push('/profile/writer/edit'); // writer profile setup
            } else if (profile?.role === 'publisher') {
                router.push('/profile/publisher/edit');
            } else {
                router.push('/dashboard'); // default for readers
            }
        };
        checkUser();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
        </div>
    );
}