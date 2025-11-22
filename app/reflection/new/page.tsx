"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { saveReflection } from "@/lib/reflections";
import Link from "next/link";
import { useState } from "react";

function NewReflectionPage() {
  const { currentUser } = useUser();

  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveReflection = async () => {
    if (!currentUser || !reflection.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveReflection(reflection.trim(), currentUser.uid, title.trim());
      setShowSuccess(true);
      setTitle("");
      setReflection("");
    } catch (err) {
      console.error(err);
      setError("Failed to save reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setTitle("");
    setReflection("");
    setError(null);
  };

  if (!currentUser) {
    return null;
  }

  if (showSuccess) {
    return (
      <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="space-y-2">
          <p className="text-3xl">✔</p>
          <h2 className="text-2xl font-semibold text-slate-900">Reflection saved!</h2>
          <p className="text-slate-600">Your thoughts have been stored securely.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/reflections"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Reflections
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Add Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Capture your thoughts</p>
        <h2 className="text-2xl font-semibold text-slate-900">New Reflection</h2>
      </header>
      <div className="space-y-2">
        <label htmlFor="title" className="sr-only">
          Reflection Title
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="text-2xl font-semibold text-slate-900 w-full border-none outline-none placeholder-slate-400"
          placeholder="Title (optional — if left empty, the first 1–2 lines will be used)"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="reflection" className="block text-sm font-medium text-slate-700">
          What stood out to you today?
        </label>
        <textarea
          id="reflection"
          name="reflection"
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          rows={5}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Write a quick note about your role, wins, or opportunities..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveReflection}
          disabled={saving || !reflection.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Reflection"}
        </button>
      </div>
      <p className="text-sm text-slate-600">Your reflections are saved securely to revisit whenever you need them.</p>
    </section>
  );
}

export default withAuth(NewReflectionPage);
