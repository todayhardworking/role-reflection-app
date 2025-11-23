export default function HomePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-slate-900">Revo Reflect – AI Role Reflection App</h1>
        <p className="text-lg text-slate-600">
          Capture your reflections, get AI role-based suggestions, and share publicly if you choose.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/signin"
          className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Sign In
        </a>
        <a
          href="/public"
          className="rounded-md border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Explore Public Reflections
        </a>
      </div>
    </section>
  );
}
