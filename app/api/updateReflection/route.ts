import admin from "firebase-admin";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function PUT(request: Request) {
  try {
    const { uid, reflectionId, text } = await request.json();

    if (!uid || !reflectionId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("reflections").doc(reflectionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    const data = doc.data();

    if (!data || data.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await docRef.update({
      text,
      updatedAt: new Date().toISOString(),
      suggestions: admin.firestore.FieldValue.delete(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reflection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reflection" },
      { status: 500 },
    );
  }
}
