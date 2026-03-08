import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function EventsPage() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('start_date', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <Link href="/" className="text-blue-900 hover:underline mb-6 inline-block">
                    ← Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-blue-900 mb-8">📅 All Events</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events?.map((event) => (
                        <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                            {event.image_url && (
                                <img 
                                    src={event.image_url} 
                                    alt={event.title}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full capitalize">
                                        {event.event_type?.replace('_', ' ')}
                                    </span>
                                    {event.is_virtual && (
                                        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                                            Virtual
                                        </span>
                                    )}
                                </div>
                                
                                <h2 className="text-xl font-bold text-blue-900 mb-2">{event.title}</h2>
                                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                                
                                <div className="space-y-2 text-sm text-gray-500 mb-4">
                                    <p>📅 {new Date(event.start_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                    {event.location && (
                                        <p>📍 {event.location}</p>
                                    )}
                                </div>

                                {event.event_url && (
                                    <a 
                                        href={event.event_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
                                    >
                                        Event Details →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {(!events || events.length === 0) && (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-500">No events scheduled at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}