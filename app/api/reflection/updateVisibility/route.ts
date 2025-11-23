import admin from "firebase-admin";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { id, isPublic, isAnonymous } = await request.json();
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || typeof isPublic !== "boolean" || typeof isAnonymous !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (verifyError) {
      console.error("Failed to verify token for visibility update", verifyError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docRef = adminDb.collection("reflections").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    const data = doc.data();

    if (!data?.uid || data.uid !== decoded.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await docRef.update({
      isPublic,
      isAnonymous,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reflection visibility:", error);
    return NextResponse.json(
      { error: "Failed to update reflection visibility" },
      { status: 500 },
    );
  }
}
