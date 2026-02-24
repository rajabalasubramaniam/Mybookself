"use client";
export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-blue-50 text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        Simple, Transparent Pricing
      </h2>

      <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        <div className="p-8 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold">Free</h3>
          <p className="mt-4">Basic tracking, 1 accountability circle</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-xl border-2 border-amber-500">
          <h3 className="text-xl font-semibold">Premium - $3/month</h3>
          <p className="mt-4">Unlimited circles, insights, AI reading coach</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-semibold">Annual - $30/year</h3>
          <p className="mt-4">2 months free</p>
        </div>
      </div>

      <p className="mt-8 text-green-600 font-semibold">
        No credit card required to start
      </p>
    </section>
  );
}
