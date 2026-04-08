export default function Features() {
  const features = [
    {
      icon: "📚",
      title: "Digital Library Organization",
      desc: "Catalog your books, categorize by reading status, and create custom collections.",
    },
    {
      icon: "🤖",
      title: "Personalized Recommendations",
      desc: "AI-driven suggestions based on your reading history and preferences.",
    },
    {
      icon: "👥",
      title: "Author & Publisher Connections",
      desc: "Exclusive content, book signings, and virtual events with creators.",
    },
    {
      icon: "🔄",
      title: "Book Lending Network",
      desc: "Borrow and lend books within a trusted community.",
    },
    {
      icon: "🎧",
      title: "E‑Book & Audiobook Integration",
      desc: "Manage digital collections alongside physical books.",
    },
    {
      icon: "⭐",
      title: "Review & Rating System",
      desc: "Share your opinions and discover quality books through peer reviews.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-900">Our Services</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Unlock your literary journey with ReadWise – where your library breathes life,
            connections flourish, and stories find their place.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}