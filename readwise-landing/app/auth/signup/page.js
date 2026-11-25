"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import Turnstile from "../../../components/Turnstile";
import { looksLikeJunkName } from "../../../lib/junkName";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("reader");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [honeypot, setHoneypot] = useState("");
    const [captchaToken, setCaptchaToken] = useState(null);
    const startedAt = useRef(Date.now());
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const router = useRouter();
    const supabase = createClient();

    // Email validation function
    const isValidEmail = (email) => {
        const disposableDomains = [
            'mailinator.com', 'guerrillamail.com', '10minutemail.com',
            'temp-mail.org', 'throwawaymail.com', 'tempmail.com',
            'fakeinbox.com', 'getnada.com', 'yopmail.com',
            'mailnator.com', 'maildrop.cc'
        ];
        
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Bots fill the hidden field; pretend success and do nothing
        if (honeypot) {
            setSuccess(true);
            setLoading(false);
            return;
        }
        if (Date.now() - startedAt.current < 3000) {
            setError("Please wait a moment, then press Sign up again.");
            setLoading(false);
            return;
        }
        if (looksLikeJunkName(fullName)) {
            setError("Please enter your real name, for example Priya Raman.");
            setLoading(false);
            return;
        }
        if (siteKey && !captchaToken) {
            setError("Please complete the security check.");
            setLoading(false);
            return;
        }

        // Validate email
        if (!isValidEmail(email)) {
            setError("Please use a valid email address. Temporary/disposable emails are not allowed.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                ...(captchaToken ? { captchaToken } : {}),
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            // Don't redirect immediately - let user see success message
            // They will be redirected after email confirmation or stay on page
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow max-w-md">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Check your email!</h2>
                    <p className="text-gray-600">
                        We've sent a confirmation link to <strong>{email}</strong>. 
                        Please check your inbox and click the link to activate your account.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow">
                <div>
                    <h2 className="text-3xl font-bold text-blue-900 text-center">Create an account</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                id="full-name"
                                name="fullName"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength="6"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                I am a
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                            >
                                <option value="reader">Reader</option>
                                <option value="writer">Writer</option>
                                <option value="publisher">Publisher</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Writer and publisher accounts are reviewed before their pages go public.</p>
                        </div>
                        {/* Hidden trap field for bots */}
                        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
                            <label htmlFor="website">Website</label>
                            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                        </div>
                    </div>

                    <Turnstile siteKey={siteKey} onToken={setCaptchaToken} />

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Sign up"}
                        </button>
                    </div>
                    <div className="text-sm text-center">
                        <Link href="/auth/login" className="font-medium text-blue-900 hover:text-blue-800">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}