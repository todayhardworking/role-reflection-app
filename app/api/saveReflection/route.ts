import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { uid, text, title, createdAt } = await request.json();

    if (!uid || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedText = text.trim();
    const trimmedTitle = (title as string | undefined)?.trim() ?? "";

    const derivedTitle = trimmedTitle ||
      trimmedText
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" ") ||
      "";

    const docRef = await adminDb.collection("reflections").add({
      uid,
      text: trimmedText,
      title: derivedTitle,
      createdAt: createdAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving reflection:", error);
    return NextResponse.json({ success: false, error: "Failed to save reflection" }, { status: 500 });
  }
}
