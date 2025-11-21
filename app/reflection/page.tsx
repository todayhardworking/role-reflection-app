"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReflectionPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [loading, currentUser, router]);

  if (loading || !currentUser) {
    return <p className="text-center text-slate-600">Loading your reflection page...</p>;
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Capture your thoughts</p>
        <h2 className="text-2xl font-semibold text-slate-900">Reflection</h2>
      </header>
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
      <p className="text-sm text-slate-600">
        This simple text area is a placeholder for your reflections. In a full app, these notes could be saved
        to Firestore for later review.
      </p>
    </section>
  );
}
