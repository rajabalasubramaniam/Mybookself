"use client";
export default function HowItWorks() {
  const steps = [
    "Scan your shelf in 60 seconds",
    "Set your reading goals",
    "Track daily progress",
    "Join accountability circles",
  ];

  return (
    <section id="how" className="py-20 text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        How It Works
      </h2>

      <div className="mt-12 grid md:grid-cols-4 gap-8 max-w-6xl mx-auto px-6">
        {steps.map((step, i) => (
          <div key={i} className="p-6 bg-blue-50 rounded-xl">
            <p className="text-amber-500 font-bold text-xl">Step {i + 1}</p>
            <p className="mt-2">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
