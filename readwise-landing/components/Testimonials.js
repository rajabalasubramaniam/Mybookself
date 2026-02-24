"use client";
import Image from "next/image";

export default function Testimonials() {
  const users = [
    { name: "Sarah K.", result: "Finished 12 books in 3 months" },
    { name: "James L.", result: "Cleared my 3-year backlog" },
    { name: "Priya M.", result: "Read 20 books last year" },
  ];

  return (
    <section className="py-20 text-center">
      <h2 className="text-3xl font-bold text-blue-900">
        Loved by Readers
      </h2>

      <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {users.map((u, i) => (
          <div key={i} className="p-8 bg-white shadow-lg rounded-2xl">
            <Image
              src={`/images/user${i + 1}.jpg`}
              width={80}
              height={80}
              alt={u.name}
              className="rounded-full mx-auto"
			  unoptimized={true}
            />
            <p className="mt-4 font-semibold">{u.name}</p>
            <p className="text-green-600 mt-2">{u.result}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
