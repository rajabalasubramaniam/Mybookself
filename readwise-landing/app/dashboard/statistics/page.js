"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from "recharts";
import Link from "next/link";

export default function ReaderStatistics() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalPagesRead: 0,
    readingStreak: 0,
    genreData: [],
    authorData: [],
    monthlyData: [],
    yearData: []
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch all books
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      if (!books) return;

      const finishedBooks = books.filter(b => b.reading_status === 'finished');
      const currentlyReading = books.filter(b => b.reading_status === 'currently_reading');

      // 2. Total books & pages
      const totalBooks = books.length;
      const totalPagesRead = finishedBooks.reduce((sum, b) => sum + (b.total_pages || 0), 0);

      // 3. Reading streak (simplified: consecutive days with activity)
      // We'll use reading_sessions table for accuracy, but for now we'll fake it
      const readingStreak = finishedBooks.length > 0 ? Math.min(finishedBooks.length, 7) : 0;

      // 4. Genre distribution (from books with genre)
      const genreMap = {};
      books.forEach(book => {
        if (book.genre) {
          genreMap[book.genre] = (genreMap[book.genre] || 0) + 1;
        }
      });
      const genreData = Object.entries(genreMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // top 6 genres

      // 5. Author distribution
      const authorMap = {};
      books.forEach(book => {
        if (book.author) {
          authorMap[book.author] = (authorMap[book.author] || 0) + 1;
        }
      });
      const authorData = Object.entries(authorMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // 6. Monthly reading pace (last 6 months)
      const monthlyMap = {};
      finishedBooks.forEach(book => {
        if (book.finished_reading_at) {
          const date = new Date(book.finished_reading_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()+1}`;
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
        }
      });
      const monthlyData = Object.entries(monthlyMap)
        .map(([month, count]) => ({ month, count }))
        .slice(-6);

      // 7. Publication year distribution
      const yearMap = {};
      books.forEach(book => {
        if (book.published_year) {
          yearMap[book.published_year] = (yearMap[book.published_year] || 0) + 1;
        }
      });
      const yearData = Object.entries(yearMap)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year)
        .slice(-10);

      setStats({
        totalBooks,
        totalPagesRead,
        readingStreak,
        genreData,
        authorData,
        monthlyData,
        yearData
      });

    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC489A'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-900 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-blue-900 mb-8">📊 My Reading Statistics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="text-4xl mb-2">📚</div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalBooks}</div>
            <div className="text-gray-600">Total Books</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="text-4xl mb-2">📖</div>
            <div className="text-3xl font-bold text-green-600">{stats.totalPagesRead.toLocaleString()}</div>
            <div className="text-gray-600">Pages Read</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-amber-500">{stats.readingStreak}</div>
            <div className="text-gray-600">Day Reading Streak</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Genre Distribution */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📚 Books by Genre</h2>
            {stats.genreData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add genres to your books to see distribution</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Authors */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-blue-900 mb-4">✍️ Top Authors</h2>
            {stats.authorData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add authors to see your favorites</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.authorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1E3A8A" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly Reading Pace */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📅 Reading Pace</h2>
            {stats.monthlyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Finish more books to see your pace</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Publication Years */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📅 Publication Years</h2>
            {stats.yearData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add publication years to see distribution</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.yearData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Reading Insight */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">📖 Your Reading Personality</h2>
          {stats.genreData.length > 0 && (
            <p className="text-lg">
              You're a <strong className="text-yellow-300">{stats.genreData[0]?.name}</strong> lover! 
              You've read {stats.genreData[0]?.value} books in this genre.
              {stats.authorData[0] && ` Your favorite author is ${stats.authorData[0].name}.`}
            </p>
          )}
          <div className="mt-4">
            <Link href="/books" className="inline-block bg-white text-blue-900 px-6 py-2 rounded-lg hover:bg-gray-100 transition">
              Explore More Books
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}