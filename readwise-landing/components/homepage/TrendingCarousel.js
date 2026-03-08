"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function TrendingCarousel({ books }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!books || books.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-8 text-center">
                <p className="text-gray-500">No trending books available</p>
            </div>
        );
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % books.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
    };

    return (
        <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            
            <div className="relative z-10 p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">🔥 Trending Today</h2>
                <p className="text-blue-100 mb-6">Most popular books in our community</p>

                <div className="flex items-center justify-between">
                    <button
                        onClick={prevSlide}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition"
                    >
                        ←
                    </button>

                    <div className="flex-1 mx-8">
                        <Link href={`/books/${books[currentIndex].book?.id || books[currentIndex].id}`}>
                            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/20 transition">
                                <div className="flex items-center gap-6">
                                    {books[currentIndex].book?.cover_url || books[currentIndex].cover_url ? (
                                        <img 
                                            src={books[currentIndex].book?.cover_url || books[currentIndex].cover_url}
                                            alt={books[currentIndex].book?.title || books[currentIndex].title}
                                            className="w-24 h-32 object-cover rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-24 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-400">No cover</span>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-2">
                                            {books[currentIndex].book?.title || books[currentIndex].title}
                                        </h3>
                                        <p className="text-blue-100 mb-2">
                                            by {books[currentIndex].book?.author || books[currentIndex].author || 'Unknown'}
                                        </p>
                                        <span className="inline-block bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                                            Rank #{books[currentIndex].rank}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <button
                        onClick={nextSlide}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition"
                    >
                        →
                    </button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center mt-4 space-x-2">
                    {books.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition ${
                                index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}