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

    const reflections = snapshot.docs.map((doc) => {
      const data = doc.data() as {
        text: string;
        createdAt?: FirebaseFirestore.Timestamp | string;
        uid: string;
        title?: string;
        rolesInvolved?: string[];
        suggestions?: Record<string, unknown> | null;
      };

      const createdAtValue = data.createdAt;
      const createdAt = createdAtValue
        ? typeof (createdAtValue as FirebaseFirestore.Timestamp).toDate ===
          "function"
          ? (createdAtValue as FirebaseFirestore.Timestamp)
              .toDate()
              .toISOString()
          : (createdAtValue as string)
        : "";

      const derivedTitle = (data.title ?? "").trim() ||
        data.text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(" ");

      return {
        id: doc.id,
        text: data.text,
        title: derivedTitle,
        uid: data.uid,
        createdAt,
        rolesInvolved: data.rolesInvolved ?? [],
        suggestions: (data.suggestions as Record<string, unknown> | null) ?? null,
      };
    });

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Error fetching reflections:", error);
    return NextResponse.json({ error: "Failed to fetch reflections" }, { status: 500 });
  }
}
