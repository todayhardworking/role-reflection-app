"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { loadReflections, type Reflection } from "@/lib/reflections";
import Link from "next/link";
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

function ReflectionsPage() {
  const { currentUser, loading } = useUser();

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);

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

  const visibleReflections = useMemo(
    () => (showOnlyPublic ? reflections.filter((r) => r.isPublic) : reflections),
    [reflections, showOnlyPublic],
  );

  const grouped = useMemo(() => groupReflections(visibleReflections), [visibleReflections]);

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

      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={showOnlyPublic}
          onChange={(e) => setShowOnlyPublic(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600"
        />
        Show only public reflections
      </label>

      {isLoading && <p className="text-slate-600">Loading reflections...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && visibleReflections.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          <p className="font-medium">{showOnlyPublic ? "No public reflections yet." : "No reflections yet."}</p>
          <p className="text-sm">
            {showOnlyPublic
              ? "Change the filter to see private entries."
              : "Start by adding your first reflection."}
          </p>
          <Link
            href="/reflection/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add a reflection
          </Link>
        </div>
      )}

      {!isLoading && !error && visibleReflections.length > 0 && (
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
                    const isPublic = reflection.isPublic;

                    const cardClassName = [
                      "rounded-xl border border-slate-200 shadow-sm p-4 bg-white hover:shadow-md transition block",
                      isPublic ? "bg-sky-50 border-sky-200" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <Link
                        key={reflection.id}
                        href={`/reflection/${reflection.id}`}
                        className={cardClassName}
                      >
                        {isPublic && (
                          <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 text-sky-800"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3.75c-4.556 0-8.25 3.694-8.25 8.25s3.694 8.25 8.25 8.25 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75zm0 0c2.071 0 3.75 3.694 3.75 8.25S14.071 20.25 12 20.25m0-16.5c-2.071 0-3.75 3.694-3.75 8.25S9.929 20.25 12 20.25"
                              />
                            </svg>
                            Public View
                          </span>
                        )}
                        <p className="mt-1 font-medium text-slate-800">
                          {reflection.title || preview || "Reflection"}
                        </p>
                        <p className="mt-2 text-slate-600 line-clamp-2">{preview}</p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          {formatTimestamp(reflection.createdAt)}
                        </p>

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

export default withAuth(ReflectionsPage);
