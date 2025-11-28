"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { useEffect, useMemo, useState } from "react";

type WeeklyHistoryEntry = {
  weekId: string;
  startISO: string;
  hasAnalysis: boolean;
};

type MonthlySummary = {
  id: string;
  uid: string;
  month: string;
  createdAt: string;
  weeksIncluded: string[];
  weeksMissing: string[];
  summary: string;
  patterns: string;
  emotionalTrend: string;
  roleTrend: string;
  productivityTrend: string;
  actionSteps: string[];
};

type MonthlyCheckResult =
  | { status: "ready"; weeksIncluded: string[]; weeksMissing: string[] }
  | { status: "blocked"; reason: string }
  | { status: "exists"; data: MonthlySummary }
  | { status: "generated"; data: MonthlySummary };

function MonthOptionLabel({ month }: { month: string }) {
  const date = useMemo(() => {
    const [year, monthNumber] = month.split("-");
    const parsedYear = Number.parseInt(year, 10);
    const parsedMonth = Number.parseInt(monthNumber, 10) - 1;
    return new Date(Date.UTC(parsedYear, parsedMonth, 1));
  }, [month]);

  return <>{date.toLocaleDateString(undefined, { year: "numeric", month: "long" })}</>;
}

function MonthlySummaryPage() {
  const { currentUser } = useUser();
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [statusResult, setStatusResult] = useState<MonthlyCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const loadMonthlyOptions = async () => {
      try {
        setLoadError(null);
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
        const weeks: WeeklyHistoryEntry[] = Array.isArray(data?.weeks)
          ? data.weeks
              .filter((week: WeeklyHistoryEntry) => week?.hasAnalysis)
              .map((week: WeeklyHistoryEntry) => ({
                weekId: week.weekId,
                startISO: week.startISO,
                hasAnalysis: week.hasAnalysis,
              }))
          : [];

        const uniqueMonths = Array.from(
          new Set(
            weeks.map((week) => {
              const date = new Date(week.startISO);
              if (Number.isNaN(date.getTime())) return "";
              const year = date.getUTCFullYear();
              const monthIndex = date.getUTCMonth() + 1;
              return `${year}-${monthIndex.toString().padStart(2, "0")}`;
            }),
          ),
        ).filter(Boolean);

        uniqueMonths.sort((a, b) => (a > b ? -1 : 1));

        if (isMounted) {
          setMonths(uniqueMonths);
          setSelectedMonth((previous) => previous || uniqueMonths[0] || "");
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setLoadError("Unable to load monthly options. Please try again later.");
        }
      }
    };

    loadMonthlyOptions();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedMonth) return;

    let isMounted = true;

    const checkMonth = async () => {
      try {
        setIsChecking(true);
        setActionError(null);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/monthlyAnalysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mode: "check", month: selectedMonth }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Failed to check monthly status");
        }

        if (!isMounted) return;
        setStatusResult(data);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setActionError("Unable to check monthly status. Please try again later.");
          setStatusResult(null);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkMonth();

    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedMonth]);

  const handleGenerate = async () => {
    if (!currentUser || !selectedMonth) return;

    try {
      setIsGenerating(true);
      setActionError(null);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/monthlyAnalysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: "generate", month: selectedMonth }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.reason || "Failed to generate monthly insights");
      }

      if (data?.status === "generated" || data?.status === "exists") {
        setStatusResult({ status: "exists", data: data.data });
      } else {
        setStatusResult(data);
      }
    } catch (error) {
      console.error(error);
      setActionError(error instanceof Error ? error.message : "Unable to generate monthly insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-sm text-slate-500">Monthly AI Insights</p>
        <h1 className="text-2xl font-semibold text-slate-900">Monthly AI Insights</h1>
        <p className="text-sm text-slate-600">Review completed months using your weekly AI summaries.</p>
      </header>

      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="space-y-3">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
          Select Month
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {months.length === 0 ? <option value="">No months available</option> : null}
            {months.map((month) => (
              <option key={month} value={month}>
                <MonthOptionLabel month={month} />
              </option>
            ))}
          </select>
        </label>
      </div>

      {isChecking ? (
        <p className="text-sm text-slate-600">Checking monthly status...</p>
      ) : actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
      ) : !selectedMonth ? (
        <p className="text-sm text-slate-600">Select a month to view your monthly AI insights.</p>
      ) : statusResult?.status === "blocked" ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Monthly AI not available</p>
          <p>{statusResult.reason}</p>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-md bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed"
          >
            Generate Monthly AI
          </button>
        </div>
      ) : statusResult?.status === "ready" ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="text-sm font-semibold text-slate-900">Monthly AI is ready to generate.</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700">
              Weeks included: {statusResult.weeksIncluded.length ? statusResult.weeksIncluded.join(", ") : "None"}
            </p>
            <p className="text-sm text-slate-700">
              Weeks missing: {statusResult.weeksMissing.length ? statusResult.weeksMissing.join(", ") : "None"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isGenerating ? "Generating..." : "Generate Monthly AI"}
          </button>
        </div>
      ) : statusResult && (statusResult.status === "exists" || statusResult.status === "generated") ? (
        <MonthlyReportCard report={statusResult.data} />
      ) : months.length === 0 ? (
        <p className="text-sm text-slate-600">No weekly summaries found yet. Generate weekly AI analyses to see monthly insights.</p>
      ) : null}
    </section>
  );
}

type MonthlyReportCardProps = {
  report: MonthlySummary;
};

function MonthlyReportCard({ report }: MonthlyReportCardProps) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Monthly Summary</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{report.summary}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Patterns</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{report.patterns}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Emotional Trend</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{report.emotionalTrend}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Role Trend</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{report.roleTrend}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Productivity Trend</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{report.productivityTrend}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Recommended Action Steps</p>
        {report.actionSteps?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
            {report.actionSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-700">No action steps provided.</p>
        )}
      </div>
      {report.weeksMissing?.length ? (
        <div className="rounded-md bg-amber-100 p-3 text-sm text-amber-800">
          <p className="font-semibold">Weeks Missing</p>
          <p>{report.weeksMissing.join(", ")}</p>
        </div>
      ) : null}
    </div>
  );
}

export default withAuth(MonthlySummaryPage);
