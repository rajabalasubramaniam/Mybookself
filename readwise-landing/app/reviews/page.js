import Link from 'next/link'
import { serverSupabase } from '../../lib/publicSupabase'

export const metadata = { title: 'Reader reviews | MyBookSelf' }

export default async function ReviewsPage() {
  const supabase = serverSupabase()
  const { data: reviews } = await supabase.from('user_reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(50)
  const list = reviews || []
  const userIds = [...new Set(list.map((r) => r.user_id))]
  const bookIds = [...new Set(list.map((r) => r.book_id))]
  const [{ data: profiles }, { data: books }] = await Promise.all([
    userIds.length ? supabase.from('public_profiles').select('id, full_name, username').in('id', userIds) : { data: [] },
    bookIds.length ? supabase.from('public_books').select('id, title, author, cover_url').in('id', bookIds) : { data: [] },
  ])
  const pm = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  const bm = Object.fromEntries((books || []).map((b) => [b.id, b]))

  return (
    <div className="min-h-screen bg-peach-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-4xl text-forest-900 mb-2">Reader reviews</h1>
        <p className="text-forest-700 mb-8">What readers on MyBookSelf thought of the books they finished.</p>
        {list.length === 0 && <p className="bg-white rounded-2xl border border-peach-200 p-8 text-center text-forest-700">No reviews yet. Finish a book and write the first one.</p>}
        <div className="space-y-4">
          {list.map((r) => {
            const b = bm[r.book_id] || {}
            const u = pm[r.user_id]
            return (
              <article key={r.id} className="bg-white rounded-2xl border border-peach-200 p-5 flex gap-4">
                {b.cover_url ? <img src={b.cover_url} alt="" className="w-16 h-24 object-cover rounded shadow-[3px_3px_0_rgba(18,53,36,.18)]" /> : <div className="w-16 h-24 rounded bg-peach-200" />}
                <div className="min-w-0">
                  <h2 className="font-semibold text-forest-900">{b.title || 'A book'}</h2>
                  <p className="text-sm text-forest-600">{b.author}</p>
                  <p className="text-gold-500 text-lg leading-none mt-1" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}<span className="text-peach-300">{'★'.repeat(5 - r.rating)}</span></p>
                  <p className="text-forest-900 mt-2 leading-relaxed">{r.review_text}</p>
                  <p className="text-xs text-forest-600 mt-2">
                    {u ? <Link href={`/profile/${u.id}`} className="hover:underline">{u.full_name}</Link> : 'A reader'} on {new Date(r.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
