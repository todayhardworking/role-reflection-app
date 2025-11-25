import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { deriveTitleFromText, type RoleSuggestion } from "@/lib/reflections";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const doc = await adminDb.collection("reflections").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    const data = doc.data() as {
      text?: string;
      title?: string;
      createdAt?: FirebaseFirestore.Timestamp | string;
      rolesInvolved?: string[];
      roles?: string[];
      isPublic?: boolean;
      isAnonymous?: boolean;
      suggestions?: Record<string, RoleSuggestion> | null;
      likes?: number;
      likedBy?: Record<string, boolean>;
    };

    if (!data?.isPublic) {
      return NextResponse.json({ error: "Reflection is not public" }, { status: 404 });
    }

    const createdAtValue = data?.createdAt;
    const createdAt = createdAtValue
      ? typeof (createdAtValue as FirebaseFirestore.Timestamp).toDate === "function"
        ? (createdAtValue as FirebaseFirestore.Timestamp).toDate().toISOString()
        : (createdAtValue as string)
      : "";

    return NextResponse.json({
      reflection: {
        id: doc.id,
        title: deriveTitleFromText(data?.text ?? "", data?.title),
        text: data?.text ?? "",
        createdAt,
        rolesInvolved: data?.rolesInvolved ?? data?.roles ?? [],
        isAnonymous: data?.isAnonymous ?? true,
        suggestions: data?.suggestions ?? null,
        likes: typeof data?.likes === "number" ? data.likes : 0,
        likedBy: data?.likedBy ?? {},
      },
    });
  } catch (error) {
    console.error("Error loading public reflection:", error);
    return NextResponse.json(
      { error: "Failed to load public reflection" },
      { status: 500 },
    );
  }
}
