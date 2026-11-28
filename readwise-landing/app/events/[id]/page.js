import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverSupabase } from '../../../lib/publicSupabase'

export default async function EventPage({ params }) {
  const supabase = serverSupabase()
  const { data: event } = await supabase.from('events').select('*').eq('id', params.id).eq('is_published', true).maybeSingle()
  if (!event) notFound()
  const start = new Date(event.start_date)
  return (
    <div className="min-h-screen bg-peach-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/events" className="text-forest-700 hover:underline">← All events</Link>
        <article className="mt-6 bg-white rounded-2xl border border-peach-200 overflow-hidden">
          {event.image_url && <img src={event.image_url} alt="" className="w-full max-h-72 object-cover" />}
          <div className="p-8">
            <div className="flex gap-2 mb-3">
              <span className="bg-peach-200 text-forest-800 text-xs px-3 py-1 rounded-full capitalize">{event.event_type?.replace('_', ' ')}</span>
              {event.is_virtual && <span className="bg-forest-100 text-forest-800 text-xs px-3 py-1 rounded-full">Online</span>}
            </div>
            <h1 className="font-display text-4xl text-forest-900">{event.title}</h1>
            <p className="mt-4 text-forest-700">
              {start.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {event.location && <p className="text-forest-700">{event.location}</p>}
            {event.description && <p className="mt-6 text-forest-900 leading-relaxed whitespace-pre-wrap">{event.description}</p>}
            {event.event_url && (
              <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-8 bg-gold-400 text-forest-900 font-semibold px-6 py-3 rounded-lg hover:bg-gold-300 transition">
                Open event page
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
