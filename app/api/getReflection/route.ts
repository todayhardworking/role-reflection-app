import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { type RoleSuggestion } from "@/lib/reflections";

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
      suggestions?: Record<string, RoleSuggestion>;
      title?: string;
      rolesInvolved?: string[];
    };

    if (uid && data?.uid && data.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const createdAtValue = data?.createdAt;
    const createdAt = createdAtValue
      ? typeof (createdAtValue as FirebaseFirestore.Timestamp).toDate === "function"
        ? (createdAtValue as FirebaseFirestore.Timestamp).toDate().toISOString()
        : (createdAtValue as string)
      : "";

    const derivedTitle = (data?.title ?? "").trim() ||
      (data?.text ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" ");

    return NextResponse.json({
      reflection: {
        id: doc.id,
        text: data?.text ?? "",
        createdAt,
        uid: data?.uid ?? "",
        suggestions: data?.suggestions ?? null,
        title: derivedTitle,
        rolesInvolved: data?.rolesInvolved ?? [],
      },
    });
  } catch (error) {
    console.error("Error fetching reflection:", error);
    return NextResponse.json({ error: "Failed to fetch reflection" }, { status: 500 });
  }
}
