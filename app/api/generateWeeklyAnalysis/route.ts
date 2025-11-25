import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getWeekRangeFromWeekId, type WeeklyAnalysis } from "@/lib/weeklySummary";

export const dynamic = "force-dynamic";

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

  const prompt = `You are an expert reflective coach. You will receive a JSON array of reflections with createdAt dates, text, and roles involved.
Write a concise weekly analysis in 5-7 sentences.
- Directly reference specific reflections (by describing what happened, not by ID).
- Provide actionable insights and next steps.
- Avoid bullet points; respond in paragraph form.
- Keep the tone supportive, practical, and specific.`;

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
  return typeof content === "string" ? content.trim() : "";
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
      return NextResponse.json({ error: "No reflections found for this week" }, { status: 400 });
    }

    const summary = await callWeeklyAnalysisModel(reflections);

    const weeklyAnalysis: WeeklyAnalysis = {
      weekId,
      summary,
      createdAt: new Date().toISOString(),
    };

    await adminDb
      .collection("weeklyAnalysis")
      .doc(decoded.uid)
      .collection("weeks")
      .doc(weekId)
      .set({ ...weeklyAnalysis, uid: decoded.uid });

    return NextResponse.json({ weeklyAnalysis });
  } catch (error) {
    console.error("Failed to generate weekly analysis", error);
    return NextResponse.json({ error: "Unable to generate weekly analysis" }, { status: 500 });
  }
}
