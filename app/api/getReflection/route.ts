import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  deriveTitleFromText,
  resolveCanRegenerate,
  type RoleSuggestion,
} from "@/lib/reflections";

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
      isPublic?: boolean;
      isAnonymous?: boolean;
      likes?: number;
      likedBy?: Record<string, boolean>;
      rateLimit?: Record<string, number>;
      canRegenerate?: boolean;
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

    const derivedTitle = deriveTitleFromText(data?.text ?? "", data?.title);

    const suggestions = data?.suggestions ?? null;
    const canRegenerate = resolveCanRegenerate(data?.canRegenerate, suggestions);

    return NextResponse.json({
      reflection: {
        id: doc.id,
        text: data?.text ?? "",
        createdAt,
        uid: data?.uid ?? "",
        suggestions,
        title: derivedTitle,
        rolesInvolved: data?.rolesInvolved ?? [],
        isPublic: data?.isPublic ?? false,
        isAnonymous: data?.isAnonymous ?? true,
        likes: typeof data?.likes === "number" ? data.likes : 0,
        likedBy: data?.likedBy ?? {},
        rateLimit: data?.rateLimit ?? {},
        canRegenerate,
      },
    });
  } catch (error) {
    console.error("Error fetching reflection:", error);
    return NextResponse.json({ error: "Failed to fetch reflection" }, { status: 500 });
  }
}
