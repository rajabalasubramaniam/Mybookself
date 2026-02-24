"use client";
export default function Features() {
  const features = [
    "Smart Scanner",
    "Progress Tracking",
    "Reading Insights",
    "Community Challenges",
    "Publisher Rewards",
    "Library Organizer",
  ];

  return (
    <section id="features" className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        Powerful Features
      </h2>

      <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {features.map((f, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl shadow">
            <p className="text-lg font-semibold">{f}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
