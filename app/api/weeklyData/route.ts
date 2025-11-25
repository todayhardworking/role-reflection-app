import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  formatWeekLabelFromWeekId,
  getWeekIdFromDate,
  getWeekRangeFromWeekId,
  type WeeklyAnalysis,
  type WeeklyReflection,
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
    console.error("Failed to verify token for weekly data", error);
    return null;
  }
}

async function fetchWeeklyAnalysis(uid: string, weekId: string): Promise<WeeklyAnalysis | null> {
  const analysisDoc = await adminDb.collection("weeklyAnalysis").doc(uid).collection("weeks").doc(weekId).get();

  if (!analysisDoc.exists) {
    return null;
  }

  const data = analysisDoc.data() as Partial<WeeklyAnalysis> | undefined;

  return {
    weekId,
    summary: typeof data?.summary === "string" ? data.summary : "",
    createdAt: toIsoString(data?.createdAt),
  };
}

async function getWeekDetail(uid: string, weekId: string) {
  const { start, endExclusive } = getWeekRangeFromWeekId(weekId);
  const startIso = start.toISOString();
  const endIso = endExclusive.toISOString();

  const reflectionsSnapshot = await adminDb
    .collection("reflections")
    .where("uid", "==", uid)
    .where("createdAt", ">=", startIso)
    .where("createdAt", "<", endIso)
    .orderBy("createdAt", "asc")
    .get();

  const reflections: WeeklyReflection[] = reflectionsSnapshot.docs.map((doc) => {
    const data = doc.data() as {
      text?: string;
      createdAt?: FirebaseFirestore.Timestamp | string;
      rolesInvolved?: string[];
      title?: string;
    };

    return {
      id: doc.id,
      text: data.text ?? "",
      createdAt: toIsoString(data.createdAt),
      rolesInvolved: Array.isArray(data.rolesInvolved)
        ? data.rolesInvolved.filter((role): role is string => typeof role === "string")
        : [],
      title: data.title,
    };
  });

  const weeklyAnalysis = await fetchWeeklyAnalysis(uid, weekId);

  return {
    reflections,
    weeklyAnalysis,
    weekLabel: formatWeekLabelFromWeekId(weekId),
  };
}

async function getWeeklyHistory(uid: string) {
  const snapshot = await adminDb
    .collection("reflections")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  const weekMap = new Map<
    string,
    {
      reflectionCount: number;
      startISO: string;
    }
  >();

  snapshot.forEach((doc) => {
    const data = doc.data() as { createdAt?: FirebaseFirestore.Timestamp | string };
    const createdAt = toIsoString(data.createdAt);
    const createdAtDate = createdAt ? new Date(createdAt) : null;

    if (!createdAtDate || Number.isNaN(createdAtDate.getTime())) return;

    const weekId = getWeekIdFromDate(createdAtDate);
    const { start } = getWeekRangeFromWeekId(weekId);
    const startISO = start.toISOString();

    const existing = weekMap.get(weekId);

    if (existing) {
      weekMap.set(weekId, {
        ...existing,
        reflectionCount: existing.reflectionCount + 1,
      });
    } else {
      weekMap.set(weekId, { reflectionCount: 1, startISO });
    }
  });

  const analysisResults = await Promise.all(
    Array.from(weekMap.keys()).map(async (weekId) => ({
      weekId,
      analysis: await fetchWeeklyAnalysis(uid, weekId),
    })),
  );

  const analysisMap = new Map<string, WeeklyAnalysis | null>();
  analysisResults.forEach((entry) => {
    analysisMap.set(entry.weekId, entry.analysis);
  });

  const weeks = Array.from(weekMap.entries())
    .map(([weekId, meta]) => ({
      weekId,
      reflectionCount: meta.reflectionCount,
      hasAnalysis: Boolean(analysisMap.get(weekId)),
      weekLabel: formatWeekLabelFromWeekId(weekId),
      startISO: meta.startISO,
    }))
    .sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime());

  return { weeks };
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await authenticate(request);

    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekId = request.nextUrl.searchParams.get("weekId");

    if (weekId) {
      try {
        const data = await getWeekDetail(decoded.uid, weekId);
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Failed to load weekly detail for ${weekId}`, error);
        const message = error instanceof Error ? error.message : "";
        if (message.toLowerCase().includes("invalid weekid")) {
          return NextResponse.json({ error: "Invalid weekId" }, { status: 400 });
        }

        return NextResponse.json({ error: "Unable to load weekly details" }, { status: 500 });
      }
    }

    const history = await getWeeklyHistory(decoded.uid);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to load weekly data", error);
    return NextResponse.json({ error: "Unable to load weekly data" }, { status: 500 });
  }
}
