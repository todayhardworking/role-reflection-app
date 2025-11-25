"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWeekCompletionInfo } from "@/lib/weeklySummary";

type WeeklyHistoryEntry = {
  weekId: string;
  reflectionCount: number;
  hasAnalysis: boolean;
  weekLabel: string;
};

function WeeklySummaryPage() {
  const { currentUser } = useUser();
  const [weeks, setWeeks] = useState<WeeklyHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generatingWeekId, setGeneratingWeekId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchWeeks = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setActionError(null);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/weeklyData", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load weekly history");
        }

        const data = await response.json();
        if (!isMounted) return;
        setWeeks(Array.isArray(data?.weeks) ? data.weeks : []);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setLoadError("Unable to load weekly history. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWeeks();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleGenerateAnalysis = async (weekId: string) => {
    if (!currentUser) return;

    try {
      setGeneratingWeekId(weekId);
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

      setWeeks((previous) =>
        previous.map((week) =>
          week.weekId === weekId
            ? {
                ...week,
                hasAnalysis: true,
              }
            : week,
          ),
      );
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "Unable to generate weekly analysis. Please try again.");
    } finally {
      setGeneratingWeekId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Weekly Archive</p>
          <h1 className="text-2xl font-semibold text-slate-900">Weekly History</h1>
          <p className="text-sm text-slate-600">Review every week that has reflections, newest first.</p>
        </div>
        <Link
          href="/weekly/current"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Current Week Summary
        </Link>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading weekly history...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : weeks.length === 0 ? (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>No weekly records yet. Create reflections to see your weekly history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          {weeks.map((week) => (
            <div key={week.weekId} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{week.weekLabel}</p>
                <p className="text-sm text-slate-600">
                  {week.reflectionCount} reflection{week.reflectionCount === 1 ? "" : "s"}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                  <span className={`h-2 w-2 rounded-full ${week.hasAnalysis ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {week.hasAnalysis ? "AI Analysis Completed" : "AI Analysis Not Yet Generated"}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  href={`/weekly/${encodeURIComponent(week.weekId)}`}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  View This Week
                </Link>
                {!week.hasAnalysis && (
                  <WeekAnalysisAction
                    isWeekComplete={getWeekCompletionInfo(week.weekId).isComplete}
                    isGenerating={generatingWeekId === week.weekId}
                    onGenerate={() => handleGenerateAnalysis(week.weekId)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type WeekAnalysisActionProps = {
  isWeekComplete: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

function WeekAnalysisAction({ isWeekComplete, isGenerating, onGenerate }: WeekAnalysisActionProps) {
  const disabled = isGenerating || !isWeekComplete;

  const buttonLabel = useMemo(() => {
    if (isGenerating) return "Generating...";
    return "Generate AI Analysis";
  }, [isGenerating]);

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      {!isWeekComplete ? <p className="text-xs font-semibold text-amber-700">Week still in progress</p> : null}
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default withAuth(WeeklySummaryPage);
