import Link from 'next/link'
import { serverSupabase } from '../../lib/publicSupabase'

export const metadata = { title: 'Publishers | MyBookSelf' }

export default async function Directory() {
  const supabase = serverSupabase()
  const { data } = await supabase.from('public_creators').select('*').eq('role', 'publisher').order('created_at', { ascending: false })
  const list = data || []
  return (
    <div className="min-h-screen bg-peach-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="font-display text-4xl text-forest-900 mb-2">Publishers</h1>
        <p className="text-forest-700 mb-8">Publishers who list their catalogue on MyBookSelf.</p>
        {list.length === 0 && (
          <div className="bg-white rounded-2xl border border-peach-200 p-8 text-center">
            <p className="text-forest-700 mb-4">No publishers yet. Run a press? Sign up as a publisher and list your catalogue.</p>
            <Link href="/auth/signup" className="bg-gold-400 text-forest-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-300">Create an account</Link>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((c) => (
            <Link key={c.id} href={`/profile/${c.id}`} className="bg-white rounded-2xl border border-peach-200 p-5 flex gap-4 hover:border-gold-400 transition">
              <div className="w-14 h-14 rounded-full bg-gold-400 text-forest-900 font-display text-2xl flex items-center justify-center shrink-0">{((c.company_name || c.full_name) || 'U').charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <h2 className="font-semibold text-forest-900">{c.company_name || c.full_name}</h2>
                {c.about && <p className="text-sm text-forest-700 mt-1 line-clamp-3">{c.about}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
