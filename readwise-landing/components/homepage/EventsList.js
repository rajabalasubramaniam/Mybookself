import Link from "next/link";

export default function EventsList({ events }) {
    if (!events || events.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-500">No upcoming events</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">📅 Upcoming Events</h3>
            <div className="space-y-4">
                {events.map((event) => (
                    <Link 
                        key={event.id} 
                        href={`/events/${event.id}`}
                        className="block p-4 border rounded-lg hover:shadow-md transition"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-800">{event.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {new Date(event.start_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {event.location || 'Online Event'}
                                </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                                {event.event_type?.replace('_', ' ')}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="mt-4 text-center">
                <Link href="/events" className="text-blue-900 hover:underline text-sm">
                    View All Events →
                </Link>
            </div>
        </div>
    );
}