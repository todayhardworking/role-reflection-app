"use client";

import { useUser } from "@/context/UserContext";
import { loadReflections, type Reflection } from "@/lib/reflections";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ReflectionsPage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const fetchReflections = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await loadReflections(currentUser.uid);
        const ordered = data
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime(),
          );
        setReflections(ordered);
      } catch (err) {
        console.error(err);
        setError("Failed to load reflections. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReflections();
  }, [currentUser]);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-slate-600">Loading reflections...</p>;
    }

    if (error) {
      return <p className="text-red-600">{error}</p>;
    }

    if (reflections.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          <p className="font-medium">No reflections yet.</p>
          <p className="text-sm">Start by adding your first reflection.</p>
          <Link
            href="/reflection/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add a reflection
          </Link>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
        {reflections.map((reflection) => (
          <li key={reflection.id} className="space-y-1 p-4">
            <p className="text-slate-800">{reflection.text}</p>
            <p className="text-sm text-slate-500">
              {reflection.createdAt
                ? new Date(reflection.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Date unavailable"}
            </p>
            <Link
              href={`/reflection/${reflection.id}`}
              className="inline-flex items-center text-sm font-semibold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-4 transition hover:decoration-slate-500"
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    );
  }, [error, isLoading, reflections]);

  if (loading || !currentUser) {
    return <p className="text-center text-slate-600">Loading reflections...</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Review your thinking</p>
        <h2 className="text-2xl font-semibold text-slate-900">Your Reflections</h2>
      </header>

      {content}
    </section>
  );
}
