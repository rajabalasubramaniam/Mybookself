"use client";
import { useState } from "react";
import Image from "next/image";

export default function HeroImage() {
    const [imgSrc, setImgSrc] = useState("/images/hero-mockup.png");

    return (
        <img 
            src={imgSrc}
            alt="Book scanner mockup"
            className="rounded-2xl shadow-xl"
            onError={() => {
                setImgSrc("https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80");
            }}
        />
    );
}