import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getWeekIdFromDate, getWeekStartISOFromWeekId, type WeeklySummary } from "@/lib/weeklySummary";

export const dynamic = "force-dynamic";

const MONTH_PATTERN = /^([0-9]{4})-([0-9]{2})$/;
const DEFAULT_TIME_ZONE = "Asia/Kuala_Lumpur";

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

type MonthlyStatusResponse =
  | { status: "blocked"; reason: string; weeksIncluded?: string[]; weeksMissing?: string[] }
  | { status: "ready"; weeksIncluded: string[]; weeksMissing: string[] }
  | { status: "exists"; monthlySummary: MonthlySummary }
  | { status: "generated"; data: MonthlySummary };

type SanitizedWeeklySummary = WeeklySummary & { weekStart: string };

function toIsoString(value: FirebaseFirestore.Timestamp | string | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toLocalDate(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const localizedString = date.toLocaleString("en-US", { timeZone });
  return new Date(localizedString);
}

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return null;
  }

  return admin
    .auth()
    .verifyIdToken(token)
    .catch((error) => {
      console.error("Failed to verify token for monthly analysis", error);
      return null;
    });
}

function getMonthBoundaries(month: string, timeZone = DEFAULT_TIME_ZONE) {
  const match = MONTH_PATTERN.exec(month);

  if (!match) {
    throw new Error("Invalid month format");
  }

  const [, yearString, monthString] = match;
  const year = Number.parseInt(yearString, 10);
  const monthIndex = Number.parseInt(monthString, 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error("Invalid month format");
  }

  const start = toLocalDate(new Date(Date.UTC(year, monthIndex, 1)), timeZone);
  start.setHours(0, 0, 0, 0);

  const nextMonthStart = toLocalDate(new Date(Date.UTC(year, monthIndex + 1, 1)), timeZone);
  nextMonthStart.setHours(0, 0, 0, 0);

  return { monthStart: start, nextMonthStart };
}

function isMonthComplete(nextMonthStart: Date, timeZone = DEFAULT_TIME_ZONE) {
  const now = toLocalDate(new Date(), timeZone);
  return now.getTime() >= nextMonthStart.getTime();
}

function enumerateWeeksForMonth(monthStart: Date, nextMonthStart: Date, timeZone = DEFAULT_TIME_ZONE) {
  const weeks = new Set<string>();
  const cursor = new Date(monthStart);

  while (cursor < nextMonthStart) {
    weeks.add(getWeekIdFromDate(cursor, timeZone));
    cursor.setDate(cursor.getDate() + 1);
  }

  return weeks;
}

function sanitizeWeeklySummary(doc: FirebaseFirestore.QueryDocumentSnapshot): SanitizedWeeklySummary {
  const data = doc.data() as Partial<WeeklySummary> | undefined;
  const weekId = data?.weekId || doc.id;
  const storedWeekStart = toIsoString(data?.weekStart as unknown as FirebaseFirestore.Timestamp | string | undefined);
  const weekStart = storedWeekStart || getWeekStartISOFromWeekId(weekId);

  return {
    weekId,
    weekStart,
    summary: data?.summary ?? "",
    wins: normalizeStringArray(data?.wins),
    challenges: normalizeStringArray(data?.challenges),
    nextWeek: normalizeStringArray(data?.nextWeek),
    createdAt: toIsoString(data?.createdAt),
  };
}

function buildMonthlySummaryObject(
  month: string,
  uid: string,
  aiResult: Record<string, unknown>,
  weeksIncluded: string[],
  weeksMissing: string[],
): MonthlySummary {
  const actionSteps = normalizeStringArray(aiResult.actionSteps);

  return {
    id: month,
    uid,
    month,
    createdAt: new Date().toISOString(),
    weeksIncluded,
    weeksMissing,
    summary: typeof aiResult.summary === "string" ? aiResult.summary : "",
    patterns: typeof aiResult.patterns === "string" ? aiResult.patterns : "",
    emotionalTrend: typeof aiResult.emotionalTrend === "string" ? aiResult.emotionalTrend : "",
    roleTrend: typeof aiResult.roleTrend === "string" ? aiResult.roleTrend : "",
    productivityTrend: typeof aiResult.productivityTrend === "string" ? aiResult.productivityTrend : "",
    actionSteps,
  };
}

function normalizeMonthlySummary(data: FirebaseFirestore.DocumentData | undefined, id: string): MonthlySummary {
  return {
    id,
    uid: typeof data?.uid === "string" ? data.uid : "",
    month: typeof data?.month === "string" ? data.month : id,
    createdAt: toIsoString(data?.createdAt),
    weeksIncluded: normalizeStringArray(data?.weeksIncluded),
    weeksMissing: normalizeStringArray(data?.weeksMissing),
    summary: typeof data?.summary === "string" ? data.summary : "",
    patterns: typeof data?.patterns === "string" ? data.patterns : "",
    emotionalTrend: typeof data?.emotionalTrend === "string" ? data.emotionalTrend : "",
    roleTrend: typeof data?.roleTrend === "string" ? data.roleTrend : "",
    productivityTrend: typeof data?.productivityTrend === "string" ? data.productivityTrend : "",
    actionSteps: normalizeStringArray(data?.actionSteps),
  };
}

async function fetchWeeklySummaries(uid: string) {
  const snapshot = await adminDb
    .collection("weeklySummaries")
    .doc(uid)
    .collection("weeks")
    .get();

  return snapshot.docs.map(sanitizeWeeklySummary);
}

function getMonthlyWeeklyCoverage(
  weeklySummaries: SanitizedWeeklySummary[],
  monthStart: Date,
  nextMonthStart: Date,
  timeZone = DEFAULT_TIME_ZONE,
) {
  const expectedWeeks = enumerateWeeksForMonth(monthStart, nextMonthStart, timeZone);
  const summaryMap = new Map(weeklySummaries.map((summary) => [summary.weekId, summary]));

  const weeksIncluded: string[] = [];
  const weeksMissing: string[] = [];
  const summaries: SanitizedWeeklySummary[] = [];

  expectedWeeks.forEach((weekId) => {
    const summary = summaryMap.get(weekId);
    if (summary) {
      weeksIncluded.push(weekId);
      summaries.push(summary);
    } else {
      weeksMissing.push(weekId);
    }
  });

  return { weeksIncluded, weeksMissing, summaries };
}

async function prepareMonthlyContext(uid: string, month: string) {
  const { monthStart, nextMonthStart } = getMonthBoundaries(month);
  const weeklySummaries = await fetchWeeklySummaries(uid);
  const { weeksIncluded, weeksMissing, summaries } = getMonthlyWeeklyCoverage(
    weeklySummaries,
    monthStart,
    nextMonthStart,
  );

  const monthlyDocRef = adminDb.collection("monthlySummaries").doc(uid).collection("months").doc(month);
  const monthlySnapshot = await monthlyDocRef.get();
  const existingMonthlySummary = monthlySnapshot.exists
    ? normalizeMonthlySummary(monthlySnapshot.data(), monthlySnapshot.id)
    : null;

  return {
    monthStart,
    nextMonthStart,
    weeklySummaries: summaries,
    weeksIncluded,
    weeksMissing,
    monthlyDocRef,
    existingMonthlySummary,
  };
}

async function callMonthlyAnalysisModel(payload: object) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const prompt = `You are an expert personal reflection coach.
Your job is to analyze a set of weekly summaries and produce a meaningful monthly review.

Using the provided weekly summaries, produce:

1. Monthly Summary:
   A clear narrative describing the major themes of the month.

2. Patterns:
   Recurring ideas, repeated problems, habits, or mindsets.

3. Emotional Trend:
   Emotional highs/lows, stress patterns, and mindset shifts.

4. Role Trend:
   How each role (entrepreneur, agent, parent, etc.) showed up or changed.

5. Productivity Trend:
   Focus, execution, energy, blockers, and momentum.

6. Action Steps:
   Give 3–5 very practical, achievable recommendations for the next month.

If some weeks are missing data:
   Add a short friendly note acknowledging incomplete data but still provide the best analysis possible.

Return your final output in strict JSON:
{
  "summary": "...",
  "patterns": "...",
  "emotionalTrend": "...",
  "roleTrend": "...",
  "productivityTrend": "...",
  "actionSteps": ["...", "...", "..."]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chat API request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";

  if (!content) {
    throw new Error("Monthly analysis model returned empty content");
  }

  return JSON.parse(content) as Record<string, unknown>;
}

async function handleCheck(
  uid: string,
  month: string,
  context: Awaited<ReturnType<typeof prepareMonthlyContext>>,
): Promise<MonthlyStatusResponse> {
  const { nextMonthStart, weeksIncluded, weeksMissing, existingMonthlySummary } = context;

  if (!isMonthComplete(nextMonthStart)) {
    return { status: "blocked", reason: "Month not fully completed", weeksIncluded, weeksMissing };
  }

  if (existingMonthlySummary) {
    return { status: "exists", monthlySummary: existingMonthlySummary };
  }

  if (!weeksIncluded.length) {
    return { status: "blocked", reason: "No weekly summaries available for this month", weeksIncluded, weeksMissing };
  }

  return { status: "ready", weeksIncluded, weeksMissing };
}

async function handleGenerate(
  uid: string,
  month: string,
  context: Awaited<ReturnType<typeof prepareMonthlyContext>>,
): Promise<MonthlyStatusResponse> {
  const { nextMonthStart, weeksIncluded, weeksMissing, weeklySummaries, monthlyDocRef, existingMonthlySummary } = context;

  if (!isMonthComplete(nextMonthStart)) {
    return { status: "blocked", reason: "Month not fully completed", weeksIncluded, weeksMissing };
  }

  if (existingMonthlySummary) {
    return { status: "exists", monthlySummary: existingMonthlySummary };
  }

  if (!weeksIncluded.length) {
    return { status: "blocked", reason: "No weekly summaries available for this month", weeksIncluded, weeksMissing };
  }

  const payload = {
    month,
    weeksIncluded,
    weeksMissing,
    weeklySummaries: weeklySummaries.map((summary) => ({
      weekId: summary.weekId,
      weekStart: summary.weekStart,
      summary: summary.summary,
      wins: summary.wins,
      challenges: summary.challenges,
      nextWeek: summary.nextWeek,
    })),
  };

  const aiResult = await callMonthlyAnalysisModel(payload);
  const monthlySummary = buildMonthlySummaryObject(month, uid, aiResult, weeksIncluded, weeksMissing);

  await monthlyDocRef.set(monthlySummary);

  return { status: "generated", data: monthlySummary };
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);

    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { month?: unknown; mode?: unknown } | null;
    const mode = typeof body?.mode === "string" ? body.mode : null;
    const month = typeof body?.month === "string" ? body.month : null;

    if (!month || !MONTH_PATTERN.test(month)) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    if (mode !== "check" && mode !== "generate") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    let context: Awaited<ReturnType<typeof prepareMonthlyContext>>;

    try {
      context = await prepareMonthlyContext(decoded.uid, month);
    } catch (prepError) {
      const message = prepError instanceof Error ? prepError.message : "";
      if (message.toLowerCase().includes("invalid month format")) {
        return NextResponse.json({ error: "Invalid month" }, { status: 400 });
      }
      throw prepError;
    }

    if (mode === "check") {
      const result = await handleCheck(decoded.uid, month, context);
      return NextResponse.json(result);
    }

    const result = await handleGenerate(decoded.uid, month, context);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process monthly analysis request", error);
    return NextResponse.json({ error: "Unable to process monthly analysis" }, { status: 500 });
  }
}
