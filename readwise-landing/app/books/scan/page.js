"use client";
import { searchBooksByISBN } from "../../../lib/bookSearch";
import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import axios from "axios";
import Link from "next/link";


export default function ScanBook() {
    const [scanResult, setScanResult] = useState(null);
    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear();
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        // ISBN format: usually starts with 978 or 979
        if (decodedText.match(/^(978|979)/)) {
            setScanResult(decodedText);
            await fetchBookByISBN(decodedText);
        }
    };

    const onScanError = (error) => {
        console.warn(error);
    };

    const fetchBookByISBN = async (isbn) => {
    setLoading(true);
    setError(null);
    
    try {
        const bookData = await searchBooksByISBN(isbn);
        setBookData(bookData);
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
};

    const addToLibrary = async () => {
        if (!bookData) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('books')
                .insert({
                    user_id: user.id,
                    title: bookData.title,
                    author: bookData.author,
                    isbn: bookData.isbn,
                    cover_url: bookData.cover_url,
                    total_pages: bookData.total_pages,
                    status: 'unread'
                });

            if (error) throw error;
            
            router.push('/books');
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    return (
		<div className="min-h-screen bg-gray-50 py-8">
		    <div className="max-w-2xl mx-auto px-4">
			<div className="mb-4 flex justify-between items-center">
                <Link href="/books" className="text-blue-900 hover:underline flex items-center">
                    ← Back to Library
                </Link>
                <Link href="/dashboard" className="text-blue-900 hover:underline">
                    Dashboard
                </Link>
            </div>	
                <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900">📷 Scan Book ISBN</h1>
                <p className="text-gray-600 mt-2">
                    Hold your phone camera over the barcode on your book
                </p>
            </div>
                
                <div id="reader" className="mb-6"></div>

                {loading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent mx-auto"></div>
                        <p className="mt-2">Fetching book details...</p>
                    </div>
                )}
				
				{bookData.source && (
					<p className="text-xs text-gray-400 mt-2">
					Source: {bookData.source}
					</p>
				)}
				
                {bookData && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Book Found!</h2>
                        <div className="flex gap-4">
                            {bookData.cover_url && (
                                <img src={bookData.cover_url} alt={bookData.title} className="w-24 h-32 object-cover rounded" />
                            )}
                            <div>
                                <h3 className="font-semibold">{bookData.title}</h3>
                                <p className="text-gray-600">by {bookData.author}</p>
                                <p className="text-sm text-gray-500 mt-2">{bookData.total_pages} pages</p>
                                <button
                                    onClick={addToLibrary}
                                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Add to Library
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}