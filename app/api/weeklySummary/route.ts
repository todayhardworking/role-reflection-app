import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  getCurrentWeekId,
  getWeekRangeFromWeekId,
  getWeekStartISOFromWeekId,
  type WeeklySummary,
} from "@/lib/weeklySummary";

export const dynamic = "force-dynamic";

type ReflectionRecord = {
  text?: string;
  createdAt?: FirebaseFirestore.Timestamp | string;
  rolesInvolved?: string[];
  suggestions?: unknown;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toIsoString(value: FirebaseFirestore.Timestamp | string | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Failed to verify token for weekly summary", error);
    return null;
  }
}

function sanitizeWeeklySummary(data: Partial<WeeklySummary> | undefined, fallbackWeekId: string): WeeklySummary {
  const inferredWeekStart = getWeekStartISOFromWeekId(fallbackWeekId);
  const providedWeekStart = toIsoString(data?.weekStart as unknown as FirebaseFirestore.Timestamp | string | undefined);

  return {
    weekId: data?.weekId ?? fallbackWeekId,
    weekStart: providedWeekStart || inferredWeekStart,
    summary: data?.summary ?? "",
    wins: normalizeStringArray(data?.wins),
    challenges: normalizeStringArray(data?.challenges),
    nextWeek: normalizeStringArray(data?.nextWeek),
    createdAt: toIsoString(data?.createdAt),
  };
}

async function callWeeklySummaryModel(reflections: Array<Record<string, unknown>>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const prompt = `You are an expert reflective coach. You will receive a JSON array of user reflections for the current week.
Each item contains a date, text, roles, and any previous AI suggestions.

Return ONLY valid JSON using this exact shape:
{
  "summary": "...",
  "wins": ["..."],
  "challenges": ["..."],
  "nextWeek": ["..."]
}

Guidelines:
- Provide a concise overall summary (5-8 sentences).
- Include the most important wins and challenges as bullet points.
- Focus nextWeek on clear, actionable steps.
- Do not include any commentary outside the JSON object.
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify(reflections),
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
  return JSON.parse(content) as {
    summary?: unknown;
    wins?: unknown;
    challenges?: unknown;
    nextWeek?: unknown;
  };
}

function buildWeeklySummaryObject(
  weekId: string,
  aiResult: {
    summary?: unknown;
    wins?: unknown;
    challenges?: unknown;
    nextWeek?: unknown;
  },
  weekStart?: string,
): WeeklySummary {
  const summaryText = typeof aiResult.summary === "string" ? aiResult.summary : "";
  const wins = normalizeStringArray(aiResult.wins);
  const challenges = normalizeStringArray(aiResult.challenges);
  const nextWeek = normalizeStringArray(aiResult.nextWeek);

  return {
    weekId,
    weekStart,
    summary: summaryText,
    wins,
    challenges,
    nextWeek,
    createdAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const decoded = await authenticate(request);

  if (!decoded?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekId = getCurrentWeekId();
  const docRef = adminDb.collection("weeklySummaries").doc(decoded.uid).collection("weeks").doc(weekId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return NextResponse.json({ weeklySummary: null });
  }

  const data = snapshot.data() as Partial<WeeklySummary> | undefined;
  const weeklySummary = sanitizeWeeklySummary(data, weekId);

  return NextResponse.json({ weeklySummary });
}

export async function POST(request: NextRequest) {
  const decoded = await authenticate(request);

  if (!decoded?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = decoded.uid;
  const weekId = getCurrentWeekId();
  const { start, endExclusive } = getWeekRangeFromWeekId(weekId);
  const weekStartISO = start.toISOString();
  const weekEndISO = endExclusive.toISOString();

  const reflectionsSnapshot = await adminDb
    .collection("reflections")
    .where("uid", "==", uid)
    .where("createdAt", ">=", weekStartISO)
    .where("createdAt", "<", weekEndISO)
    .orderBy("createdAt", "asc")
    .get();

  const reflections = reflectionsSnapshot.docs.map((doc) => {
    const data = doc.data() as ReflectionRecord;
    const createdAtIso = toIsoString(data.createdAt);

    return {
      id: doc.id,
      date: createdAtIso,
      text: data.text ?? "",
      roles: normalizeStringArray(data.rolesInvolved),
      aiSuggestions: data.suggestions ?? null,
    };
  });

  const aiResult = await callWeeklySummaryModel(reflections);
  const weeklySummary = buildWeeklySummaryObject(weekId, aiResult, weekStartISO);

  await adminDb
    .collection("weeklySummaries")
    .doc(uid)
    .collection("weeks")
    .doc(weekId)
    .set({ ...weeklySummary, uid, weekStart: weekStartISO });

  return NextResponse.json({ weeklySummary });
}
