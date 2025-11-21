import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const reflectionId = searchParams.get("reflectionId");
    const uid = searchParams.get("uid");

    if (!reflectionId) {
      return NextResponse.json({ error: "Missing reflectionId" }, { status: 400 });
    }

    const doc = await adminDb.collection("reflections").doc(reflectionId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    const data = doc.data() as {
      text?: string;
      createdAt?: FirebaseFirestore.Timestamp | string;
      uid?: string;
      suggestions?: Record<string, string>;
    };

    if (uid && data?.uid && data.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const createdAtValue = data?.createdAt;
    const createdAt = createdAtValue
      ? typeof (createdAtValue as FirebaseFirestore.Timestamp).toDate === "function"
        ? (createdAtValue as FirebaseFirestore.Timestamp).toDate().toISOString()
        : (createdAtValue as string)
      : null;

    return NextResponse.json({
      reflection: {
        id: doc.id,
        text: data?.text ?? "",
        createdAt,
        uid: data?.uid ?? "",
        suggestions: data?.suggestions ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching reflection:", error);
    return NextResponse.json({ error: "Failed to fetch reflection" }, { status: 500 });
  }
}
