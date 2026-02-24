"use client";
export default function Problem() {
  return (
    <section className="py-20 bg-white text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        You're Not Alone in the 'To-Be-Read' Pile
      </h2>

      <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="p-8 bg-blue-50 rounded-2xl">
          <p className="text-4xl font-bold text-amber-500">87%</p>
          <p className="mt-2">of books purchased go unfinished</p>
        </div>

        <div className="p-8 bg-blue-50 rounded-2xl">
          <p className="text-4xl font-bold text-amber-500">$120/year</p>
          <p className="mt-2">spent on unread books</p>
        </div>
      </div>

      <p className="mt-10 text-gray-600 max-w-2xl mx-auto">
        Stop collecting. Start reading. Every book deserves to be finished.
      </p>
    </section>
  );
}
