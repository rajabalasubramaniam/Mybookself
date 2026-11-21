import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
      .select('id, title, author, cover_url, status, reading_status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)
    library = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Avatar and basic info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-3xl">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-900">{profile.full_name}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-sm text-gray-500 mt-1 capitalize">Role: {profile.role}</p>
              </div>
            </div>

            {/* Writer details */}
            {profile.role === 'writer' && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">About the Writer</h2>
                {roleData.bio && <p className="text-gray-700 whitespace-pre-wrap">{roleData.bio}</p>}
                {roleData.website && (
                  <p className="mt-2">
                    Website: <a href={roleData.website} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">{roleData.website}</a>
                  </p>
                )}
                {roleData.social_links?.twitter && (
                  <p className="mt-1">Twitter: {roleData.social_links.twitter}</p>
                )}
              </div>
            )}

            {/* Publisher details */}
            {profile.role === 'publisher' && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">{roleData.company_name || 'Publisher'}</h2>
                {roleData.description && <p className="text-gray-700">{roleData.description}</p>}
                {roleData.website && (
                  <p className="mt-2">
                    Website: <a href={roleData.website} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">{roleData.website}</a>
                  </p>
                )}
                {roleData.address && <p className="mt-1">📍 {roleData.address}</p>}
                {roleData.contact_email && <p className="mt-1">📧 {roleData.contact_email}</p>}
              </div>
            )}

            {/* Simple reader view (just basic info already shown) */}
            {profile.role === 'reader' && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Reader</h2>
                <p className="text-gray-700">{profile.books_read || 0} books read</p>
              </div>
            )}

            {/* Public library (owner's choice) */}
            {profile.library_public && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Shelf</h2>
                {library.length === 0 ? (
                  <p className="text-gray-500">No books on this shelf yet.</p>
                ) : (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {library.map(b => (
                      <li key={b.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">{b.title}</p>
                        <p className="text-sm text-gray-500">{b.author}</p>
                        <p className="text-xs text-gray-400 mt-1 capitalize">{b.reading_status || b.status}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Back to home link */}
            <div className="mt-8">
              <Link href="/" className="text-blue-900 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}