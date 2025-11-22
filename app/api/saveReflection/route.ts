import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { uid, text, createdAt } = await request.json();

    if (!uid || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await adminDb.collection("reflections").add({
      uid,
      text,
      createdAt:
        typeof createdAt === "string" && createdAt.trim().length > 0
          ? createdAt
          : new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving reflection:", error);
    return NextResponse.json({ success: false, error: "Failed to save reflection" }, { status: 500 });
  }
}
