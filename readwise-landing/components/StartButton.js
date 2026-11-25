"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

// Sign-up button for visitors; goes straight to the shelf for logged-in members
export default function StartButton({ className, label = "Start Your Shelf", loggedInLabel = "Open My Shelf" }) {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
    }, []);

    return (
        <Link href={loggedIn ? "/books" : "/auth/signup"} className={className}>
            {loggedIn ? loggedInLabel : label}
        </Link>
    );
}
