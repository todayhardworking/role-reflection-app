"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { formatWeekLabel, type WeeklySummary } from "@/lib/weeklySummary";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function WeeklyReportPage() {
  const { currentUser } = useUser();
  const router = useRouter();

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const weekLabel = useMemo(() => formatWeekLabel(), []);

  const fetchWeeklySummary = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/weeklySummary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load weekly summary");
      }

      const data = await response.json();
      setWeeklySummary(data.weeklySummary ?? null);
    } catch (err) {
      console.error(err);
      setError("Unable to load weekly summary.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchWeeklySummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleGenerate = async () => {
    if (!currentUser) return;

    try {
      setIsGenerating(true);
      setError(null);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/weeklySummary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to generate weekly summary");
      }

      const data = await response.json();
      setWeeklySummary(data.weeklySummary ?? null);
    } catch (err) {
      console.error(err);
      setError("Unable to generate weekly summary. Please try again.");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">This Week</p>
          <h1 className="text-2xl font-semibold text-slate-900">Weekly Summary</h1>
          <p className="text-sm text-slate-700">{weekLabel}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isGenerating ? "Generating..." : "Generate Weekly Summary"}
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading weekly summary...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : weeklySummary ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Overall Summary</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{weeklySummary.summary}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Wins</h3>
            {weeklySummary.wins.length ? (
              <ul className="mt-2 space-y-2 text-slate-700">
                {weeklySummary.wins.map((win, index) => (
                  <li key={`win-${index}`} className="list-disc list-inside">
                    {win}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No wins recorded for this week yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Challenges</h3>
            {weeklySummary.challenges.length ? (
              <ul className="mt-2 space-y-2 text-slate-700">
                {weeklySummary.challenges.map((challenge, index) => (
                  <li key={`challenge-${index}`} className="list-disc list-inside">
                    {challenge}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No challenges recorded for this week yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Focus for Next Week</h3>
            {weeklySummary.nextWeek.length ? (
              <ul className="mt-2 space-y-2 text-slate-700">
                {weeklySummary.nextWeek.map((item, index) => (
                  <li key={`next-${index}`} className="list-disc list-inside">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No recommendations yet. Generate a summary to see AI guidance.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">No weekly summary available for this week yet.</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isGenerating ? "Generating..." : "Generate Weekly Summary"}
          </button>
        </div>
      )}
    </section>
  );
}

export default withAuth(WeeklyReportPage);
