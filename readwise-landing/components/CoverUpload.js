"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

// Shrinks a photo to a small JPEG so uploads are fast on mobile data
async function resizeToJpeg(file, maxSide = 700, quality = 0.8) {
    let bitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
        bitmap = await createImageBitmap(file);
    }
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not read the photo"))), "image/jpeg", quality)
    );
}

export default function CoverUpload({ value, onChange, id = "cover-photo-input", compact = false }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const supabase = createClient();

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Please log in again");
            const blob = await resizeToJpeg(file);
            const path = `${user.id}/${Date.now()}.jpg`;
            const { error: upErr } = await supabase.storage
                .from("book-covers")
                .upload(path, blob, { contentType: "image/jpeg" });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
            onChange(data.publicUrl);
        } catch (err) {
            setError(err.message || "Upload failed");
        } finally {
            setBusy(false);
            e.target.value = "";
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {value && <img src={value} alt="Cover preview" className="w-8 h-11 object-cover rounded border" />}
                <label htmlFor={id} className="cursor-pointer text-xs text-blue-700 underline">
                    {busy ? "Uploading..." : value ? "Retake cover photo" : "📷 Add cover photo"}
                </label>
                <input id={id} type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={busy} className="sr-only" />
                {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
        );
    }

    return (
        <div>
            <label className="block text-gray-700 font-medium mb-2">Cover photo</label>
            <div className="flex items-center gap-4">
                {value ? (
                    <img src={value} alt="Cover preview" className="w-20 h-28 object-cover rounded-lg border" />
                ) : (
                    <div className="w-20 h-28 bg-gray-100 border border-dashed rounded-lg flex items-center justify-center text-xs text-gray-400">
                        No cover
                    </div>
                )}
                <div>
                    <label
                        htmlFor={id}
                        className="inline-block cursor-pointer bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-sm"
                    >
                        {busy ? "Uploading..." : value ? "Retake photo" : "Take or choose photo"}
                    </label>
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFile}
                        disabled={busy}
                        className="sr-only"
                    />
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
}
