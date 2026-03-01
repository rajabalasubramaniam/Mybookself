"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportLibrary() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data } = await supabase
                .from('books')
                .select('*')
                .eq('user_id', user.id)
                .order('title');
            setBooks(data || []);
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const headers = ['Title', 'Author', 'ISBN', 'Pages', 'Status', 'Progress'];
        const csvData = books.map(book => [
            book.title,
            book.author || '',
            book.isbn || '',
            book.total_pages || '',
            book.status,
            `${book.current_page || 0}/${book.total_pages || 0}`
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-library-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        
        doc.text('My Book Library', 14, 15);
        
        const tableData = books.map(book => [
            book.title,
            book.author || 'Unknown',
            book.status,
            `${book.current_page || 0}/${book.total_pages || 0}`
        ]);

        autoTable(doc, {
            head: [['Title', 'Author', 'Status', 'Progress']],
            body: tableData,
            startY: 20,
        });

        doc.save(`my-library-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-blue-900 mb-6">📤 Export Your Library</h1>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow p-6 mb-6">
                            <p className="text-gray-600 mb-4">
                                You have <span className="font-bold text-blue-900">{books.length}</span> books in your library.
                            </p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={exportCSV}
                                    className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition text-center"
                                >
                                    <div className="text-3xl mb-2">📊</div>
                                    <div className="font-semibold">Export as CSV</div>
                                    <div className="text-sm opacity-75">Open in Excel/Sheets</div>
                                </button>

                                <button
                                    onClick={exportPDF}
                                    className="bg-red-600 text-white p-6 rounded-xl hover:bg-red-700 transition text-center"
                                >
                                    <div className="text-3xl mb-2">📄</div>
                                    <div className="font-semibold">Export as PDF</div>
                                    <div className="text-sm opacity-75">Printable format</div>
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-bold text-blue-900 mb-4">Preview</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Title</th>
                                            <th className="px-4 py-2 text-left">Author</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                            <th className="px-4 py-2 text-left">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.slice(0, 5).map(book => (
                                            <tr key={book.id} className="border-t">
                                                <td className="px-4 py-2">{book.title}</td>
                                                <td className="px-4 py-2">{book.author || '-'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        book.status === 'finished' ? 'bg-green-100 text-green-800' :
                                                        book.status === 'reading' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">{book.current_page || 0}/{book.total_pages || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {books.length > 5 && (
                                    <p className="text-sm text-gray-500 mt-4">... and {books.length - 5} more books</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}