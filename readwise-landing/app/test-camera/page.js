"use client";
import { useEffect, useRef } from "react";

export default function TestCamera() {
    const videoRef = useRef(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Camera error:", err));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl mb-4">Camera Test</h1>
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md" />
        </div>
    );
}