import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readerType } from '../../../lib/readerType'

export default async function PublicProfilePage({ params }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  const userId = params.id

  // 1. Fetch base profile
  const { data: profile, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    notFound()
  }

  // 2. Fetch role-specific data
  let roleData = {}
  if (profile.role === 'writer') {
    const { data } = await supabase
      .from('writer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    roleData = data || {}
  } else if (profile.role === 'publisher') {
    const { data } = await supabase
      .from('publisher_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    roleData = data || {}
  }

  // 3. Library: only when the owner has made it public (no private notes are exposed)
  let library = []
  if (profile.library_public) {
    const { data } = await supabase
      .from('public_libraries')
      .select('id, title, author, cover_url, genre, status, reading_status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)
    library = data || []
  }

  const finished = library.filter((b) => b.reading_status === 'finished').length
  const reading = library.filter((b) => b.reading_status === 'currently_reading')
  const type = profile.library_public && library.length ? readerType(library) : null
  const pct = library.length ? Math.round((finished / library.length) * 100) : 0
  const initial = (profile.full_name || 'U').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-peach-50">
      {/* Banner */}
      <div className="bg-forest-900 text-peach-100">
        <div className="max-w-4xl mx-auto px-4 py-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gold-400 text-forest-900 font-display text-4xl flex items-center justify-center shrink-0">{initial}</div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl text-peach-50 truncate">{profile.full_name}</h1>
            <p className="text-peach-200">@{profile.username}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-forest-800 text-peach-200 px-3 py-1 rounded-full capitalize">{profile.role}</span>
              {type && <span className="text-xs bg-gold-400 text-forest-900 font-semibold px-3 py-1 rounded-full">{type.name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {type && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[[library.length, 'on the shelf'], [finished, 'finished'], [`${pct}%`, 'read']].map(([n, l]) => (
              <div key={l} className="bg-white rounded-2xl border border-peach-200 py-4">
                <div className="font-display text-3xl text-forest-900">{n}</div>
                <div className="text-xs text-forest-600">{l}</div>
              </div>
            ))}
          </div>
        )}
        {type && <p className="text-forest-700">{type.note}</p>}

        {profile.role === 'writer' && (
          <div className="bg-white rounded-2xl border border-peach-200 p-6">
            <h2 className="font-display text-2xl text-forest-900 mb-3">About the writer</h2>
            {roleData.bio && <p className="text-forest-900 whitespace-pre-wrap leading-relaxed">{roleData.bio}</p>}
            {roleData.website && <p className="mt-2">Website: <a href={roleData.website} target="_blank" rel="noopener noreferrer" className="text-gold-700 hover:underline">{roleData.website}</a></p>}
            {roleData.social_links?.twitter && <p className="mt-1">Twitter: {roleData.social_links.twitter}</p>}
          </div>
        )}

        {profile.role === 'publisher' && (
          <div className="bg-white rounded-2xl border border-peach-200 p-6">
            <h2 className="font-display text-2xl text-forest-900 mb-3">{roleData.company_name || 'Publisher'}</h2>
            {roleData.description && <p className="text-forest-900 leading-relaxed">{roleData.description}</p>}
            {roleData.website && <p className="mt-2">Website: <a href={roleData.website} target="_blank" rel="noopener noreferrer" className="text-gold-700 hover:underline">{roleData.website}</a></p>}
            {roleData.address && <p className="mt-1">{roleData.address}</p>}
            {roleData.contact_email && <p className="mt-1">{roleData.contact_email}</p>}
          </div>
        )}

        {profile.role === 'reader' && !profile.library_public && (
          <div className="bg-white rounded-2xl border border-peach-200 p-6 text-forest-700">
            {profile.full_name} keeps their shelf private.{profile.books_read ? ` ${profile.books_read} books read.` : ''}
          </div>
        )}

        {reading.length > 0 && (
          <div>
            <h2 className="font-display text-2xl text-forest-900 mb-3">Reading now</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {reading.map((b) => (
                <div key={b.id} className="w-24 shrink-0">
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-peach-200 shadow-[3px_3px_0_rgba(18,53,36,.18)]">
                    {b.cover_url && <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs mt-1 line-clamp-2 text-forest-900">{b.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.library_public && (
          <div>
            <h2 className="font-display text-2xl text-forest-900 mb-3">Shelf</h2>
            {library.length === 0 ? (
              <p className="text-forest-700">No books on this shelf yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {library.map((b) => (
                  <div key={b.id}>
                    <div className="aspect-[2/3] rounded-md overflow-hidden bg-peach-200 shadow-[3px_3px_0_rgba(18,53,36,.18)]">
                      {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center p-1 text-center text-[11px] text-forest-700">{b.title}</div>}
                    </div>
                    <p className="text-[11px] mt-1 text-forest-900 line-clamp-2">{b.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Link href="/" className="inline-block text-forest-700 hover:underline">← Back to home</Link>
      </div>
    </div>
  )
}
