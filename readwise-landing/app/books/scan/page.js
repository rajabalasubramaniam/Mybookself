"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchBooksByISBN } from "../../../lib/bookSearch";
import { createClient } from "../../../lib/supabase/client";
import CoverUpload from "../../../components/CoverUpload";

// ---- ISBN helpers ----
function isbn13Valid(code) {
    if (!/^\d{13}$/.test(code)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(code[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === Number(code[12]);
}

function normaliseIsbn(raw) {
    const digits = (raw || "").replace(/[^0-9Xx]/g, "").toUpperCase();
    if (digits.length === 13) return isbn13Valid(digits) ? digits : null;
    if (digits.length === 10) {
        const core = "978" + digits.slice(0, 9);
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
        return core + ((10 - (sum % 10)) % 10);
    }
    return null;
}

export default function BatchScan() {
    const [items, setItems] = useState([]);
    const [shelf, setShelf] = useState({ shelf_location: "", bought_at: "" });
    const [manualIsbn, setManualIsbn] = useState("");
    const [cameraError, setCameraError] = useState(null);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const seen = useRef(new Set());
    const owned = useRef(new Set());
    const router = useRouter();
    const supabase = createClient();

    // Load the ISBNs already in this user's library, to skip duplicates
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth/login"); return; }
            const { data } = await supabase.from("books").select("isbn").eq("user_id", user.id);
            (data || []).forEach((b) => b.isbn && owned.current.add(b.isbn));
        })();
    }, []);

    const patchItem = (isbn, patch) =>
        setItems((prev) => prev.map((it) => (it.isbn === isbn ? { ...it, ...patch } : it)));

    const handleCode = async (raw) => {
        const isbn = normaliseIsbn(raw);
        if (!isbn) { setMessage("That is not a valid ISBN. Check the digits."); return; }
        if (seen.current.has(isbn)) return;
        seen.current.add(isbn);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(80);

        if (owned.current.has(isbn)) {
            setItems((prev) => [{ isbn, status: "exists", title: "", author: "" }, ...prev]);
            return;
        }
        setItems((prev) => [{ isbn, status: "loading", title: "", author: "" }, ...prev]);
        try {
            const book = await searchBooksByISBN(isbn);
            patchItem(isbn, {
                status: "found",
                title: book.title || "",
                author: book.author || "",
                cover_url: book.cover_url || null,
                total_pages: book.total_pages || null,
            });
        } catch (e) {
            patchItem(isbn, { status: "notfound" });
        }
    };

    // Camera stays on so many books can be scanned in a row
    useEffect(() => {
        let scanner = null;
        let cancelled = false;
        (async () => {
            try {
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
                if (cancelled) return;
                scanner = new Html5Qrcode("reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
                    verbose: false,
                });
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 280, height: 120 } },
                    (text) => handleCode(text),
                    () => {}
                );
            } catch (err) {
                setCameraError("The camera could not start. Allow camera access, or type the ISBN below.");
            }
        })();
        return () => {
            cancelled = true;
            if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {});
        };
    }, []);

    const addManualIsbn = (e) => {
        e.preventDefault();
        setMessage(null);
        handleCode(manualIsbn);
        setManualIsbn("");
    };

    const removeItem = (isbn) => {
        seen.current.delete(isbn);
        setItems((prev) => prev.filter((it) => it.isbn !== isbn));
    };

    const saveable = items.filter((it) => it.status !== "loading" && it.status !== "exists" && it.title.trim());

    const saveAll = async () => {
        if (saveable.length === 0) return;
        setSaving(true);
        setMessage(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const now = new Date().toISOString();
            const rows = saveable.map((it) => ({
                user_id: user.id,
                title: it.title.trim(),
                author: it.author.trim() || null,
                isbn: it.isbn,
                cover_url: it.cover_url || null,
                total_pages: it.total_pages || 0,
                status: "unread",
                reading_status: "queue",
                current_page: 0,
                shelf_location: shelf.shelf_location.trim() || null,
                bought_at: shelf.bought_at.trim() || null,
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("books").insert(rows);
            if (error) throw error;
            rows.forEach((r) => owned.current.add(r.isbn));
            const savedIsbns = new Set(rows.map((r) => r.isbn));
            setItems((prev) => prev.filter((it) => !savedIsbns.has(it.isbn)));
            setSavedCount((c) => c + rows.length);
        } catch (err) {
            setMessage("Could not save: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-4 flex justify-between items-center">
                    <Link href="/books" className="text-blue-900 hover:underline">← Back to Library</Link>
                    <Link href="/books/add" className="text-blue-900 hover:underline">Search or add by hand</Link>
                </div>

                <h1 className="text-3xl font-bold text-blue-900">Scan your shelf</h1>
                <p className="text-gray-600 mt-2 mb-6">
                    Point the camera at each barcode, one after another. Review the list, then save them all at once.
                </p>

                <div className="bg-white rounded-xl shadow p-4 mb-6 grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="scan_shelf" className="block text-sm text-gray-700 font-medium mb-1">Shelf or room (optional)</label>
                        <input id="scan_shelf" type="text" value={shelf.shelf_location} onChange={(e) => setShelf({ ...shelf, shelf_location: e.target.value })} placeholder="e.g. Hall shelf 2" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="scan_bought" className="block text-sm text-gray-700 font-medium mb-1">Bought at (optional)</label>
                        <input id="scan_bought" type="text" value={shelf.bought_at} onChange={(e) => setShelf({ ...shelf, bought_at: e.target.value })} placeholder="e.g. Chennai Book Fair 2026" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <p className="sm:col-span-2 text-xs text-gray-500">Applies to every book in this batch. Change it before the next shelf.</p>
                </div>

                <div id="reader" className="mb-3 rounded-xl overflow-hidden bg-black/5 min-h-[120px]"></div>
                {cameraError && <p className="mb-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">{cameraError}</p>}

                <form onSubmit={addManualIsbn} className="flex gap-2 mb-6">
                    <label htmlFor="manual_isbn" className="sr-only">Type an ISBN</label>
                    <input id="manual_isbn" type="text" inputMode="numeric" value={manualIsbn} onChange={(e) => setManualIsbn(e.target.value)} placeholder="Or type an ISBN (10 or 13 digits)" className="flex-1 px-3 py-2 border rounded-lg" />
                    <button type="submit" disabled={!manualIsbn.trim()} className="bg-blue-900 text-white px-4 py-2 rounded-lg disabled:opacity-50">Add</button>
                </form>

                {message && <p className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</p>}

                {savedCount > 0 && (
                    <p className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                        {savedCount} {savedCount === 1 ? "book" : "books"} saved to your shelf. Keep scanning, or <Link href="/books" className="underline">view your library</Link>.
                    </p>
                )}

                <h2 className="text-lg font-semibold text-gray-800 mb-3">This batch ({items.length})</h2>
                {items.length === 0 ? (
                    <p className="text-gray-500 bg-white rounded-xl shadow p-6 text-center">No books scanned yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((it) => (
                            <li key={it.isbn} className="bg-white rounded-xl shadow p-4">
                                <div className="flex gap-3">
                                    {it.cover_url ? (
                                        <img src={it.cover_url} alt="" className="w-12 h-16 object-cover rounded" />
                                    ) : (
                                        <div className="w-12 h-16 bg-gray-100 rounded" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-400">ISBN {it.isbn}</p>
                                        {it.status === "loading" && <p className="text-sm text-gray-500">Looking up...</p>}
                                        {it.status === "exists" && <p className="text-sm text-amber-700">Already in your library.</p>}
                                        {(it.status === "found" || it.status === "notfound") && (
                                            <div className="space-y-2 mt-1">
                                                {it.status === "notfound" && (
                                                    <p className="text-xs text-amber-700">Not found online. Type the details.</p>
                                                )}
                                                <input type="text" aria-label="Title" value={it.title} onChange={(e) => patchItem(it.isbn, { title: e.target.value })} placeholder="Title" className="w-full px-2 py-1 border rounded text-sm" />
                                                <input type="text" aria-label="Author" value={it.author} onChange={(e) => patchItem(it.isbn, { author: e.target.value })} placeholder="Author" className="w-full px-2 py-1 border rounded text-sm" />
                                                <CoverUpload compact id={`cover-${it.isbn}`} value={it.cover_url} onChange={(url) => patchItem(it.isbn, { cover_url: url })} />
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeItem(it.isbn)} className="text-sm text-gray-400 hover:text-red-600 self-start" aria-label="Remove">✕</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="sticky bottom-0 bg-gray-50 pt-4 pb-4 mt-4">
                    <button
                        type="button"
                        onClick={saveAll}
                        disabled={saving || saveable.length === 0}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : `Save ${saveable.length} ${saveable.length === 1 ? "book" : "books"} to my shelf`}
                    </button>
                </div>
            </div>
        </div>
    );
}
