import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("reflections")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const reflections = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as { text: string; createdAt: string; uid: string }),
    }));

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Error fetching reflections:", error);
    return NextResponse.json({ error: "Failed to fetch reflections" }, { status: 500 });
  }
}
