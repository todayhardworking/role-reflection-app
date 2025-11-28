"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { useEffect, useMemo, useState } from "react";

type WeeklyHistoryEntry = {
  weekId: string;
  weekLabel: string;
  hasAnalysis: boolean;
  startISO: string;
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

type MonthlyStatus =
  | { status: "ready"; weeksIncluded: string[]; weeksMissing: string[] }
  | { status: "blocked"; reason: string; weeksIncluded?: string[]; weeksMissing?: string[] }
  | { status: "exists"; monthlySummary: MonthlySummary };

function MonthlySummaryPage() {
  const { currentUser } = useUser();
  const [weeks, setWeeks] = useState<WeeklyHistoryEntry[]>([]);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);
  const [weeksError, setWeeksError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [status, setStatus] = useState<MonthlyStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchWeeklyHistory = async () => {
      try {
        setIsLoadingWeeks(true);
        setWeeksError(null);
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
        const history = Array.isArray(data?.weeks) ? data.weeks : [];
        setWeeks(history);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setWeeksError("Unable to load weekly history. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingWeeks(false);
        }
      }
    };

    fetchWeeklyHistory();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    weeks.forEach((week) => {
      if (!week.hasAnalysis || !week.startISO) return;
      const date = new Date(week.startISO);
      if (Number.isNaN(date.getTime())) return;
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthSet.add(monthLabel);
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [weeks]);

  useEffect(() => {
    if (!selectedMonth && availableMonths.length) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  useEffect(() => {
    if (!currentUser || !selectedMonth) return;

    let isMounted = true;

    const checkMonthStatus = async () => {
      try {
        setIsChecking(true);
        setStatusError(null);
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/monthlyAnalysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mode: "check", month: selectedMonth }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || "Unable to check monthly analysis status");
        }

        const data = await response.json();
        if (!isMounted) return;

        if (data?.status === "generated" && data?.data) {
          setStatus({ status: "exists", monthlySummary: data.data });
        } else if (data?.status === "exists" && data?.monthlySummary) {
          setStatus({ status: "exists", monthlySummary: data.monthlySummary });
        } else if (data?.status === "ready") {
          setStatus({
            status: "ready",
            weeksIncluded: data.weeksIncluded ?? [],
            weeksMissing: data.weeksMissing ?? [],
          });
        } else if (data?.status === "blocked") {
          setStatus({
            status: "blocked",
            reason: data.reason ?? "Month not ready",
            weeksIncluded: data.weeksIncluded,
            weeksMissing: data.weeksMissing,
          });
        } else {
          setStatus(null);
          setStatusError("Unexpected response from monthly analysis check.");
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setStatus(null);
          setStatusError(
            err instanceof Error ? err.message : "Unable to check monthly analysis status. Please try again later.",
          );
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkMonthStatus();

    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedMonth]);

  const handleGenerate = async () => {
    if (!currentUser || !selectedMonth) return;

    try {
      setIsGenerating(true);
      setStatusError(null);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/monthlyAnalysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: "generate", month: selectedMonth }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to generate monthly insights");
      }

      const data = await response.json();
      if (data?.status === "generated" && data?.data) {
        setStatus({ status: "exists", monthlySummary: data.data });
      } else if (data?.status === "exists" && data?.monthlySummary) {
        setStatus({ status: "exists", monthlySummary: data.monthlySummary });
      } else if (data?.status === "blocked") {
        setStatus({
          status: "blocked",
          reason: data.reason ?? "Month not ready",
          weeksIncluded: data.weeksIncluded,
          weeksMissing: data.weeksMissing,
        });
      } else {
        setStatusError("Unexpected response while generating monthly insights.");
      }
    } catch (err) {
      console.error(err);
      setStatusError(err instanceof Error ? err.message : "Unable to generate monthly insights. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  const currentReport = status?.status === "exists" ? status.monthlySummary : null;

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Monthly AI</p>
          <h1 className="text-2xl font-semibold text-slate-900">Monthly AI Insights</h1>
          <p className="text-sm text-slate-600">Generate a monthly recap using completed weekly AI summaries.</p>
        </div>
      </header>

      {isLoadingWeeks ? (
        <p className="text-sm text-slate-600">Loading available months...</p>
      ) : weeksError ? (
        <p className="text-sm text-red-600">{weeksError}</p>
      ) : availableMonths.length === 0 ? (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>No completed weekly summaries yet. Generate weekly AI analyses to unlock monthly insights.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="text-sm font-semibold text-slate-800" htmlFor="month-select">
                Select Month
              </label>
              <select
                id="month-select"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 sm:w-48"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs text-slate-500">Months listed only where weekly AI summaries exist.</div>
          </div>

          {statusError ? <p className="text-sm text-red-600">{statusError}</p> : null}

          {isChecking ? (
            <p className="text-sm text-slate-600">Checking monthly status...</p>
          ) : status?.status === "exists" && currentReport ? (
            <MonthlyReportCard report={currentReport} />
          ) : status?.status === "ready" ? (
            <ReadyStateCard
              weeksIncluded={status.weeksIncluded}
              weeksMissing={status.weeksMissing}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          ) : status?.status === "blocked" ? (
            <BlockedStateCard
              reason={status.reason}
              weeksMissing={status.weeksMissing}
              weeksIncluded={status.weeksIncluded}
            />
          ) : (
            <p className="text-sm text-slate-600">Select a month to view its status.</p>
          )}
        </div>
      )}
    </section>
  );
}

type ReadyStateCardProps = {
  weeksIncluded: string[];
  weeksMissing: string[];
  onGenerate: () => void;
  isGenerating: boolean;
};

function ReadyStateCard({ weeksIncluded, weeksMissing, onGenerate, isGenerating }: ReadyStateCardProps) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Monthly AI is ready</p>
          <p className="text-sm text-slate-600">Review the weeks below, then generate your monthly insights.</p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isGenerating ? "Generating..." : "Generate Monthly AI"}
        </button>
      </div>
      <WeekList title="Weeks included" weeks={weeksIncluded} highlight="included" />
      {weeksMissing.length > 0 ? <WeekList title="Weeks missing" weeks={weeksMissing} highlight="missing" /> : null}
    </div>
  );
}

type WeekListProps = {
  title: string;
  weeks: string[];
  highlight: "included" | "missing";
};

function WeekList({ title, weeks, highlight }: WeekListProps) {
  const badgeClasses =
    highlight === "included"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {weeks.length === 0 ? (
        <p className="text-sm text-slate-600">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {weeks.map((weekId) => (
            <span
              key={weekId}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}
            >
              {weekId}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type BlockedStateCardProps = {
  reason: string;
  weeksIncluded?: string[];
  weeksMissing?: string[];
};

function BlockedStateCard({ reason, weeksIncluded = [], weeksMissing = [] }: BlockedStateCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Monthly AI is blocked</p>
      <p className="text-sm text-slate-700">{reason}</p>
      {weeksIncluded.length || weeksMissing.length ? (
        <div className="space-y-2">
          <WeekList title="Weeks included" weeks={weeksIncluded} highlight="included" />
          {weeksMissing.length > 0 ? <WeekList title="Weeks missing" weeks={weeksMissing} highlight="missing" /> : null}
        </div>
      ) : null}
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-md bg-slate-400 px-3 py-2 text-sm font-semibold text-white"
      >
        Generate Monthly AI
      </button>
    </div>
  );
}

type MonthlyReportCardProps = {
  report: MonthlySummary;
};

function MonthlyReportCard({ report }: MonthlyReportCardProps) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">Monthly AI Report</p>
        <p className="text-xs text-slate-500">Generated on {new Date(report.createdAt).toLocaleString()}</p>
      </div>
      <div className="space-y-3">
        <ReportSection title="Monthly Summary" content={report.summary} />
        <ReportSection title="Patterns" content={report.patterns} />
        <ReportSection title="Emotional Trend" content={report.emotionalTrend} />
        <ReportSection title="Role Trend" content={report.roleTrend} />
        <ReportSection title="Productivity Trend" content={report.productivityTrend} />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Recommended Action Steps</p>
          {report.actionSteps.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {report.actionSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No action steps generated.</p>
          )}
        </div>
        {report.weeksMissing.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Missing weekly summaries: {report.weeksMissing.join(", ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ReportSectionProps = {
  title: string;
  content: string;
};

function ReportSection({ title, content }: ReportSectionProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">{content || "No data available."}</p>
    </div>
  );
}

export default withAuth(MonthlySummaryPage);
