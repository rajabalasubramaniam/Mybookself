export default function WaitlistForm() {
  return (
    <div className="mt-8">
      <input
        type="email"
        placeholder="Enter your email"
        className="border px-4 py-3 rounded-l-xl w-64"
      />
      <button className="bg-amber-500 text-white px-6 py-3 rounded-r-xl hover:bg-amber-600">
        Join Beta
      </button>
    </div>
  );
}
