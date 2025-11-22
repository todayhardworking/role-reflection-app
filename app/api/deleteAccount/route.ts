import admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

async function deleteUserReflections(uid: string) {
  const snapshot = await adminDb.collection("reflections").where("uid", "==", uid).get();

  if (snapshot.empty) return;

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function deleteUserProfile(uid: string) {
  await adminDb.collection("users").doc(uid).delete();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    await deleteUserReflections(uid);
    await deleteUserProfile(uid);
    await admin.auth().deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
