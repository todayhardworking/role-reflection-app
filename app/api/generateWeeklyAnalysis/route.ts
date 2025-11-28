import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  getWeekCompletionInfo,
  getWeekRangeFromWeekId,
  getWeekStartISOFromWeekId,
  type WeeklySummary,
} from "@/lib/weeklySummary";

export const dynamic = "force-dynamic";

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
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Failed to verify token for weekly analysis generation", error);
    return null;
  }
}

async function callWeeklyAnalysisModel(reflections: Array<Record<string, unknown>>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const prompt = `You are an expert reflective coach. You will receive a JSON array of user reflections for a week. Each item contains a date, text, roles, and any previous AI suggestions.

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
- Do not include any commentary outside the JSON object.`;

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
  let parsed: Record<string, unknown> = {};

  if (typeof content === "string" && content.trim()) {
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse weekly analysis model response", error);
      parsed = {};
    }
  }

  return parsed as {
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

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);

    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { weekId?: unknown; uid?: unknown } | null;
    const weekId = typeof body?.weekId === "string" ? body.weekId : null;

    if (!weekId) {
      return NextResponse.json({ error: "Missing weekId" }, { status: 400 });
    }

    let start: Date;
    let endExclusive: Date;

    try {
      ({ start, endExclusive } = getWeekRangeFromWeekId(weekId));
    } catch (rangeError) {
      console.error(`Invalid weekId provided for weekly analysis: ${weekId}`, rangeError);
      return NextResponse.json({ error: "Invalid weekId" }, { status: 400 });
    }

    const { isComplete } = getWeekCompletionInfo(weekId);

    if (!isComplete) {
      return NextResponse.json(
        { error: "Weekly analysis is only available after the full week is completed." },
        { status: 400 },
      );
    }

    const weekStartISO = start.toISOString();
    const weekEndISO = endExclusive.toISOString();

    const reflectionsSnapshot = await adminDb
      .collection("reflections")
      .where("uid", "==", decoded.uid)
      .where("createdAt", ">=", weekStartISO)
      .where("createdAt", "<", weekEndISO)
      .orderBy("createdAt", "asc")
      .get();

    const reflections = reflectionsSnapshot.docs.map((doc) => {
      const data = doc.data() as {
        text?: string;
        createdAt?: FirebaseFirestore.Timestamp | string;
        rolesInvolved?: string[];
        title?: string;
      };

      return {
        id: doc.id,
        createdAt: toIsoString(data.createdAt),
        text: data.text ?? "",
        rolesInvolved: Array.isArray(data.rolesInvolved)
          ? data.rolesInvolved.filter((role): role is string => typeof role === "string")
          : [],
        title: data.title ?? "",
      };
    });

    if (!reflections.length) {
      return NextResponse.json(
        { error: "No reflections found for this week. Cannot generate analysis." },
        { status: 422 },
      );
    }

    const aiResult = await callWeeklyAnalysisModel(reflections);
    const weeklySummary = buildWeeklySummaryObject(weekId, aiResult, weekStartISO || getWeekStartISOFromWeekId(weekId));

    await adminDb
      .collection("weeklySummaries")
      .doc(decoded.uid)
      .collection("weeks")
      .doc(weekId)
      .set({ ...weeklySummary, uid: decoded.uid });

    return NextResponse.json({ weeklySummary });
  } catch (error) {
    console.error("Failed to generate weekly analysis", error);
    return NextResponse.json({ error: "Unable to generate weekly analysis" }, { status: 500 });
  }
}
