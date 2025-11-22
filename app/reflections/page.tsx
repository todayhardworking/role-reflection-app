"use client";

export const authRequired = true;

import { useUser } from "@/context/UserContext";
import { loadReflections, type Reflection } from "@/lib/reflections";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ReflectionGroups = Record<
  "Today" | "Yesterday" | "Last 7 Days" | "Last Month" | "Older",
  Reflection[]
>;

function formatTimestamp(createdAt?: string) {
  if (!createdAt) return "Date unavailable";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const datePart = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} — ${timePart}`;
}

function buildPreview(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function groupReflections(reflections: Reflection[]): ReflectionGroups {
  const groups: ReflectionGroups = {
    Today: [],
    Yesterday: [],
    "Last 7 Days": [],
    "Last Month": [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfSevenDaysAgo = new Date(startOfToday);
  startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 7);

  const startOfThisMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const startOfLastMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, 1);

  reflections.forEach((reflection) => {
    const date = new Date(reflection.createdAt);
    const isValidDate = reflection.createdAt && !Number.isNaN(date.getTime());

    if (!isValidDate) {
      groups.Older.push(reflection);
      return;
    }

    if (date >= startOfToday) {
      groups.Today.push(reflection);
    } else if (date >= startOfYesterday) {
      groups.Yesterday.push(reflection);
    } else if (date >= startOfSevenDaysAgo) {
      groups["Last 7 Days"].push(reflection);
    } else if (date >= startOfLastMonth && date < startOfThisMonth) {
      groups["Last Month"].push(reflection);
    } else {
      groups.Older.push(reflection);
    }
  });

  return groups;
}

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

  const grouped = useMemo(() => groupReflections(reflections), [reflections]);

  if (loading || !currentUser) {
    return <p className="text-center text-slate-600">Loading reflections...</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Premium journaling view</p>
        <h2 className="text-2xl font-semibold text-slate-900">Your Reflections</h2>
        <p className="text-sm text-slate-600">Browse by time and jump into any entry.</p>
      </header>

      {isLoading && <p className="text-slate-600">Loading reflections...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && reflections.length === 0 && (
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
      )}

      {!isLoading && !error && reflections.length > 0 && (
        <div className="space-y-6">
          {(
            [
              "Today",
              "Yesterday",
              "Last 7 Days",
              "Last Month",
              "Older",
            ] as const
          ).map((groupKey) => {
            const items = grouped[groupKey];
            if (!items || items.length === 0) return null;

            return (
              <div key={groupKey} className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">{groupKey}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((reflection) => {
                    const preview = buildPreview(reflection.text);

                    return (
                      <Link
                        key={reflection.id}
                        href={`/reflection/${reflection.id}`}
                        className="rounded-xl border border-slate-200 shadow-sm p-4 bg-white hover:shadow-md transition block"
                      >
                        <p className="text-lg font-semibold text-slate-900">
                          {formatTimestamp(reflection.createdAt)}
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {reflection.title || preview || "Reflection"}
                        </p>
                        <p className="mt-2 text-slate-600 line-clamp-2">{preview}</p>

                        {reflection.rolesInvolved && reflection.rolesInvolved.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reflection.rolesInvolved.map((role) => (
                              <span
                                key={role}
                                className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
