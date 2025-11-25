"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import {
  formatWeekLabelFromWeekId,
  type WeeklyReflection,
  type WeeklySummary,
} from "@/lib/weeklySummary";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WeeklyDetailPageProps = {
  params: { weekId: string };
};

function formatDateLabel(value: string) {
  if (!value) return "Date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unknown";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function WeeklyDetailPage({ params }: WeeklyDetailPageProps) {
  const { currentUser } = useUser();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { weekId } = params;

  const weekLabel = useMemo(() => {
    try {
      return formatWeekLabelFromWeekId(weekId);
    } catch (err) {
      console.error(err);
      return weekId;
    }
  }, [weekId]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchWeekDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/weeklyData?weekId=${encodeURIComponent(weekId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load weekly details");
        }

        const data = await response.json();
        if (!isMounted) return;
        setReflections(Array.isArray(data?.reflections) ? data.reflections : []);
        setWeeklySummary(data?.weeklySummary ?? null);
        setActionError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setLoadError("Unable to load this week. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWeekDetails();

    return () => {
      isMounted = false;
    };
  }, [currentUser, weekId]);

  const handleGenerateAnalysis = async () => {
    if (!currentUser) return;

    try {
      setIsGenerating(true);
      setActionError(null);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/generateWeeklyAnalysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: currentUser.uid, weekId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to generate weekly analysis");
      }

      const data = await response.json();
      setWeeklySummary(data?.weeklySummary ?? null);
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "Unable to generate weekly analysis. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Weekly Reflections</p>
          <h1 className="text-2xl font-semibold text-slate-900">{weekLabel}</h1>
          <p className="text-sm text-slate-600">{reflections.length} reflection{reflections.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/weekly/summary"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Back to Weekly History
          </Link>
          <Link
            href="/weekly/current"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Current Week Summary
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading weekly details...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">AI Weekly Analysis</p>
              <p className="text-sm text-slate-600">
                Get a focused 5-7 sentence analysis summarizing this week&apos;s reflections with actionable insights.
              </p>
            </div>
            {!weeklySummary && (
              <button
                type="button"
                onClick={handleGenerateAnalysis}
                disabled={isGenerating}
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {isGenerating ? "Generating..." : "Generate Weekly AI Analysis"}
              </button>
            )}
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            {weeklySummary ? (
              <div className="space-y-3 rounded-md bg-white p-4 text-slate-800 shadow-sm">
                <div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{weeklySummary.summary}</p>
                  <p className="text-xs text-slate-500">Generated on {formatDateLabel(weeklySummary.createdAt)}</p>
                </div>
                {weeklySummary.wins.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Wins</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {weeklySummary.wins.map((win, index) => (
                        <li key={index}>{win}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {weeklySummary.challenges.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Challenges</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {weeklySummary.challenges.map((challenge, index) => (
                        <li key={index}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {weeklySummary.nextWeek.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Next Week Focus</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {weeklySummary.nextWeek.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : !isGenerating ? (
              <p className="text-sm text-slate-700">
                No AI analysis has been generated for this week yet.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reflections</h2>
              <span className="text-xs font-semibold text-slate-600">{reflections.length} total</span>
            </div>
            {reflections.length ? (
              <ul className="space-y-3">
                {reflections.map((reflection) => (
                  <li
                    key={reflection.id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-800 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{formatDateLabel(reflection.createdAt)}</span>
                      {reflection.rolesInvolved.length ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-800">
                          {reflection.rolesInvolved.join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-900 whitespace-pre-line">{reflection.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No reflections recorded for this week.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default withAuth(WeeklyDetailPage);
