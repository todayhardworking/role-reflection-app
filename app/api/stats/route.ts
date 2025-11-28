import admin from "firebase-admin";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const USER_TIME_ZONE = "Asia/Kuala_Lumpur";
const MS_PER_DAY = 86_400_000;

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
    console.error("Failed to verify token for stats", error);
    return null;
  }
}

function toTimestamp(date: Date) {
  return admin.firestore.Timestamp.fromDate(date);
}

function parseCreatedAt(value: FirebaseFirestore.Timestamp | string | undefined) {
  if (!value) return null;

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await authenticate(request);

    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reflectionsCollection = adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("reflections");

    const now = DateTime.now().setZone(USER_TIME_ZONE);
    const startOfWeek = toTimestamp(now.startOf("week").toJSDate());
    const startOfMonth = toTimestamp(now.startOf("month").toJSDate());

    const [
      totalReflectionsSnapshot,
      totalPublicReflectionsSnapshot,
      reflectionsThisWeekSnapshot,
      reflectionsThisMonthSnapshot,
    ] = await Promise.all([
      reflectionsCollection.count().get(),
      reflectionsCollection.where("isPublic", "==", true).count().get(),
      reflectionsCollection.where("createdAt", ">=", startOfWeek).count().get(),
      reflectionsCollection.where("createdAt", ">=", startOfMonth).count().get(),
    ]);

    const publicReflectionsSnapshot = await reflectionsCollection.where("isPublic", "==", true).get();

    let totalLikesReceived = 0;
    publicReflectionsSnapshot.forEach((doc) => {
      const data = doc.data() as { likesCount?: number };
      totalLikesReceived += typeof data.likesCount === "number" ? data.likesCount : 0;
    });

    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const userData = userDoc.data() as { createdAt?: FirebaseFirestore.Timestamp | string } | undefined;
    const parsedCreatedAt = parseCreatedAt(userData?.createdAt);
    const fallbackCreatedAt = parsedCreatedAt ?? now.toJSDate();

    const nowDate = now.toJSDate();
    const daysWithRevo = parsedCreatedAt
      ? Math.max(0, Math.floor((nowDate.getTime() - parsedCreatedAt.getTime()) / MS_PER_DAY))
      : 0;
    const accountCreatedAt = fallbackCreatedAt.toISOString();

    return NextResponse.json({
      totalReflections: totalReflectionsSnapshot.data().count ?? 0,
      totalPublicReflections: totalPublicReflectionsSnapshot.data().count ?? 0,
      totalLikesReceived,
      reflectionsThisWeek: reflectionsThisWeekSnapshot.data().count ?? 0,
      reflectionsThisMonth: reflectionsThisMonthSnapshot.data().count ?? 0,
      daysWithRevo,
      accountCreatedAt,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
