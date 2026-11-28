import Link from 'next/link'
import { serverSupabase } from '../../lib/publicSupabase'

export const metadata = { title: 'Events | MyBookSelf' }

export default async function EventsPage() {
  const supabase = serverSupabase()
  const { data: events } = await supabase.from('events').select('*').eq('is_published', true).order('start_date', { ascending: true })
  const now = Date.now()
  const upcoming = (events || []).filter((e) => new Date(e.start_date).getTime() >= now)
  const past = (events || []).filter((e) => new Date(e.start_date).getTime() < now).reverse()

  const Card = ({ event, dim }) => {
    const d = new Date(event.start_date)
    return (
      <Link href={`/events/${event.id}`} className={`flex gap-4 bg-white rounded-2xl border border-peach-200 p-4 hover:border-gold-400 transition ${dim ? 'opacity-70' : ''}`}>
        <div className="w-16 shrink-0 rounded-xl bg-forest-900 text-peach-50 text-center py-2">
          <div className="font-display text-2xl leading-none">{d.getDate()}</div>
          <div className="text-xs mt-1">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-forest-900">{event.title}</h3>
          <p className="text-sm text-forest-700">{event.is_virtual ? 'Online' : event.location || 'Venue to be announced'}</p>
          {event.description && <p className="text-sm text-forest-600 mt-1 line-clamp-2">{event.description}</p>}
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-peach-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-display text-4xl text-forest-900 mb-2">Events</h1>
        <p className="text-forest-700 mb-8">Book launches, readings and meetups for readers.</p>
        {upcoming.length === 0 && <p className="bg-white rounded-2xl border border-peach-200 p-8 text-center text-forest-700">No upcoming events yet. Check back soon.</p>}
        <div className="space-y-3">{upcoming.map((e) => <Card key={e.id} event={e} />)}</div>
        {past.length > 0 && (
          <>
            <h2 className="font-display text-2xl text-forest-900 mt-12 mb-4">Past events</h2>
            <div className="space-y-3">{past.map((e) => <Card key={e.id} event={e} dim />)}</div>
          </>
        )}
      </div>
    </div>
  )
}
