"use client";
function Card({ title, desc }) {
  return (
    <div className="p-8 bg-white shadow-lg rounded-2xl hover:shadow-xl transition">
      <h3 className="text-xl font-semibold text-blue-900">{title}</h3>
      <p className="mt-4 text-gray-600">{desc}</p>
    </div>
  );
}

export default function Solution() {
  return (
    <section className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        From Unread Pile to Completed Library
      </h2>

      <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        <Card
          title="Digital Library"
          desc="Scan books with your phone and organize your physical collection."
        />
        <Card
          title="Reading Tracker"
          desc="Set goals, track progress, earn achievements."
        />
        <Card
          title="Accountability Circles"
          desc="Join readers who motivate each other."
        />
      </div>
    </section>
  );
}
