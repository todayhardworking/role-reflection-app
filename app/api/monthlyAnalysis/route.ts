import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  getWeekIdFromDate,
  getWeekStartIsoFromWeekId,
  toLocalDate,
  type WeeklySummary,
} from "@/lib/weeklySummary";

export const dynamic = "force-dynamic";

const DEFAULT_TIME_ZONE = "Asia/Kuala_Lumpur";

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

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Failed to verify token for monthly analysis", error);
    return null;
  }
}

function parseMonth(month: string) {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(month);
  if (!match) return null;

  const [, yearString, monthString] = match;
  const year = Number.parseInt(yearString, 10);
  const monthIndex = Number.parseInt(monthString, 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) return null;

  return { year, monthIndex };
}

function getMonthRange(month: string, timeZone = DEFAULT_TIME_ZONE) {
  const parsed = parseMonth(month);
  if (!parsed) {
    throw new Error("Invalid month format");
  }

  const start = toLocalDate(new Date(Date.UTC(parsed.year, parsed.monthIndex, 1)), timeZone);
  start.setHours(0, 0, 0, 0);

  const endExclusive = new Date(start);
  endExclusive.setMonth(endExclusive.getMonth() + 1);

  return { start, endExclusive };
}

function isMonthComplete(month: string, timeZone = DEFAULT_TIME_ZONE, currentDate = new Date()) {
  const { endExclusive } = getMonthRange(month, timeZone);
  const now = toLocalDate(currentDate, timeZone);
  return now.getTime() >= endExclusive.getTime();
}

function getWeeksCoveringMonth(month: string, timeZone = DEFAULT_TIME_ZONE) {
  const { start, endExclusive } = getMonthRange(month, timeZone);
  const cursor = new Date(start);
  const weekIds = new Set<string>();

  while (cursor.getTime() < endExclusive.getTime()) {
    weekIds.add(getWeekIdFromDate(cursor, timeZone));
    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(weekIds);
}

function sanitizeWeeklySummary(data: Partial<WeeklySummary> | undefined, fallbackWeekId: string): WeeklySummary {
  const weekId = data?.weekId ?? fallbackWeekId;
  const computedWeekStart = getWeekStartIsoFromWeekId(weekId);

  return {
    weekId,
    weekStart: typeof data?.weekStart === "string" && data.weekStart ? data.weekStart : computedWeekStart,
    summary: data?.summary ?? "",
    wins: normalizeStringArray(data?.wins),
    challenges: normalizeStringArray(data?.challenges),
    nextWeek: normalizeStringArray(data?.nextWeek),
    createdAt: toIsoString(data?.createdAt),
  };
}

async function loadMonthlySummary(uid: string, month: string) {
  const docRef = adminDb.collection("monthlySummaries").doc(uid).collection("months").doc(month);
  const snapshot = await docRef.get();

  if (!snapshot.exists) return null;

  const data = snapshot.data() as Partial<MonthlySummary> | undefined;

  return sanitizeMonthlySummary(data, month);
}

async function fetchWeeklySummaries(uid: string, weekIds: string[]) {
  const summaries = await Promise.all(
    weekIds.map(async (weekId) => {
      const snapshot = await adminDb
        .collection("weeklySummaries")
        .doc(uid)
        .collection("weeks")
        .doc(weekId)
        .get();

      if (!snapshot.exists) return null;

      const data = snapshot.data() as Partial<WeeklySummary> | undefined;
      return sanitizeWeeklySummary(data, weekId);
    }),
  );

  return summaries.filter((item): item is WeeklySummary => Boolean(item));
}

function sanitizeMonthlySummary(data: Partial<MonthlySummary> | undefined, month: string): MonthlySummary {
  return {
    id: data?.id ?? month,
    uid: data?.uid ?? "",
    month: data?.month ?? month,
    createdAt: toIsoString(data?.createdAt) || new Date().toISOString(),
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

function buildMonthlyPrompt(weeklySummaries: WeeklySummary[], weeksMissing: string[]) {
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

  const weeklyPayload = weeklySummaries.map((item) => ({
    weekId: item.weekId,
    summary: item.summary,
  }));

  const userContent = {
    weeklySummaries: weeklyPayload,
    weeksMissing,
  };

  return {
    system: prompt,
    user: JSON.stringify(userContent),
  };
}

async function callMonthlyAnalysisModel(weeklySummaries: WeeklySummary[], weeksMissing: string[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const { system, user } = buildMonthlyPrompt(weeklySummaries, weeksMissing);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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
  return JSON.parse(content) as {
    summary?: unknown;
    patterns?: unknown;
    emotionalTrend?: unknown;
    roleTrend?: unknown;
    productivityTrend?: unknown;
    actionSteps?: unknown;
  };
}

function normalizeMonthlyModelResult(modelResult: ReturnType<typeof JSON.parse>): Omit<MonthlySummary, "id" | "uid" | "month" | "createdAt" | "weeksIncluded" | "weeksMissing"> {
  const actionSteps = normalizeStringArray(modelResult?.actionSteps);

  return {
    summary: typeof modelResult?.summary === "string" ? modelResult.summary : "",
    patterns: typeof modelResult?.patterns === "string" ? modelResult.patterns : "",
    emotionalTrend: typeof modelResult?.emotionalTrend === "string" ? modelResult.emotionalTrend : "",
    roleTrend: typeof modelResult?.roleTrend === "string" ? modelResult.roleTrend : "",
    productivityTrend: typeof modelResult?.productivityTrend === "string" ? modelResult.productivityTrend : "",
    actionSteps,
  };
}

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

async function handleCheck(uid: string, month: string) {
  const existing = await loadMonthlySummary(uid, month);
  if (existing) {
    return NextResponse.json({ status: "exists", data: existing });
  }

  if (!isMonthComplete(month)) {
    return NextResponse.json({ status: "blocked", reason: "Month not fully completed" });
  }

  const expectedWeeks = getWeeksCoveringMonth(month);
  const weeklySummaries = await fetchWeeklySummaries(uid, expectedWeeks);
  const weeksIncluded = weeklySummaries.map((item) => item.weekId);
  const weeksMissing = expectedWeeks.filter((weekId) => !weeksIncluded.includes(weekId));

  if (weeksIncluded.length === 0) {
    return NextResponse.json({ status: "blocked", reason: "No weekly summaries available for this month" });
  }

  return NextResponse.json({ status: "ready", weeksIncluded, weeksMissing });
}

async function handleGenerate(uid: string, month: string) {
  const existing = await loadMonthlySummary(uid, month);
  if (existing) {
    return NextResponse.json({ status: "exists", data: existing });
  }

  if (!isMonthComplete(month)) {
    return NextResponse.json({ status: "blocked", reason: "Month not fully completed" });
  }

  const expectedWeeks = getWeeksCoveringMonth(month);
  const weeklySummaries = await fetchWeeklySummaries(uid, expectedWeeks);
  const weeksIncluded = weeklySummaries.map((item) => item.weekId);
  const weeksMissing = expectedWeeks.filter((weekId) => !weeksIncluded.includes(weekId));

  if (weeksIncluded.length === 0) {
    return NextResponse.json({ status: "blocked", reason: "No weekly summaries available for this month" });
  }

  const modelResult = await callMonthlyAnalysisModel(weeklySummaries, weeksMissing);
  const normalized = normalizeMonthlyModelResult(modelResult);

  const monthlySummary: MonthlySummary = {
    id: month,
    uid,
    month,
    createdAt: new Date().toISOString(),
    weeksIncluded,
    weeksMissing,
    ...normalized,
  };

  await adminDb.collection("monthlySummaries").doc(uid).collection("months").doc(month).set(monthlySummary);

  return NextResponse.json({ status: "generated", data: monthlySummary });
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);

    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { month?: unknown; mode?: unknown } | null;
    const month = typeof body?.month === "string" ? body.month : null;
    const mode = typeof body?.mode === "string" ? body.mode : null;

    if (!month || !mode) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (!parseMonth(month)) {
      return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
    }

    if (mode === "check") {
      return await handleCheck(decoded.uid, month);
    }

    if (mode === "generate") {
      return await handleGenerate(decoded.uid, month);
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process monthly analysis", error);
    return NextResponse.json({ error: "Unable to process monthly analysis" }, { status: 500 });
  }
}
