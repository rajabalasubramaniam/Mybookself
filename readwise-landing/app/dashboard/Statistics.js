"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export default function Statistics() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    readingStreak: 0,
    booksThisMonth: 0,
    genreDistribution: [],
    monthlyProgress: [],
    recentActivity: []
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

      // Get all books
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      // Get reading sessions
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false });

      if (!books || !sessions) return;

      // Calculate statistics
      const totalBooks = books.length;
      const finishedBooks = books.filter(b => b.status === 'finished').length;
      const totalPages = books.reduce((sum, b) => sum + (b.total_pages || 0), 0);
      const pagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);

      // Calculate reading streak
      let streak = 0;
      const today = new Date();
      const sessionDates = [...new Set(sessions.map(s => 
        new Date(s.session_date).toDateString()
      ))];

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        if (sessionDates.includes(date.toDateString())) {
          streak++;
        } else {
          break;
        }
      }

      // Books finished this month
      const thisMonth = new Date().getMonth();
      const booksThisMonth = books.filter(b => {
        const finishDate = new Date(b.updated_at);
        return b.status === 'finished' && finishDate.getMonth() === thisMonth;
      }).length;

      // Genre distribution (from categories)
      const genres = {};
      books.forEach(book => {
        if (book.categories) {
          const category = book.categories[0] || 'Uncategorized';
          genres[category] = (genres[category] || 0) + 1;
        }
      });
      const genreData = Object.entries(genres).map(([name, value]) => ({ name, value }));

      // Monthly progress (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleString('default', { month: 'short' });
        
        const booksFinished = books.filter(b => {
          const finishDate = new Date(b.updated_at);
          return b.status === 'finished' && 
                 finishDate.getMonth() === month.getMonth() &&
                 finishDate.getFullYear() === month.getFullYear();
        }).length;

        monthlyData.push({ month: monthName, books: booksFinished });
      }

      setStats({
        totalBooks,
        finishedBooks,
        totalPages,
        pagesRead,
        readingStreak: streak,
        booksThisMonth,
        genreDistribution: genreData,
        monthlyProgress: monthlyData,
        recentActivity: sessions.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Books" 
          value={stats.totalBooks} 
          icon="📚"
          color="bg-blue-900"
        />
        <StatCard 
          title="Pages Read" 
          value={stats.pagesRead.toLocaleString()} 
          icon="📄"
          color="bg-green-600"
        />
        <StatCard 
          title="Reading Streak" 
          value={`${stats.readingStreak} days`} 
          icon="🔥"
          color="bg-amber-500"
        />
        <StatCard 
          title="Finished This Month" 
          value={stats.booksThisMonth} 
          icon="✅"
          color="bg-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Progress Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Monthly Reading Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="books" fill="#1E3A8A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📚 Books by Genre</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genreDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.genreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reading Streak Timeline */}
        <div className="bg-white p-6 rounded-xl shadow md:col-span-2">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Recent Reading Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((session, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2">
                <span>{new Date(session.session_date).toLocaleDateString()}</span>
                <span className="text-green-600 font-semibold">+{session.pages_read} pages</span>
                {session.minutes_read > 0 && (
                  <span className="text-gray-600">{session.minutes_read} minutes</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} text-white p-4 rounded-xl shadow-lg`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}