import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { deriveTitleFromText } from "@/lib/reflections";

export async function POST(request: Request) {
  try {
    const { uid, text, title, createdAt } = await request.json();

    if (!uid || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedText = text.trim();
    const derivedTitle = deriveTitleFromText(trimmedText, title);

    const docRef = await adminDb.collection("reflections").add({
      uid,
      text: trimmedText,
      title: derivedTitle,
      createdAt: createdAt || new Date().toISOString(),
      isPublic: false,
      isAnonymous: true,
      likes: 0,
      likedBy: {},
      rateLimit: {},
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving reflection:", error);
    return NextResponse.json({ success: false, error: "Failed to save reflection" }, { status: 500 });
  }
}
