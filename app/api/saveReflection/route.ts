import { firebaseApp } from "@/lib/firebase";
import { NextResponse } from "next/server";
import { addDoc, collection, getFirestore } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { uid, text, createdAt } = await request.json();

    if (!uid || !text || !createdAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getFirestore(firebaseApp);
    const docRef = await addDoc(collection(db, "reflections"), {
      uid,
      text,
      createdAt,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving reflection:", error);
    return NextResponse.json({ success: false, error: "Failed to save reflection" }, { status: 500 });
  }
}
