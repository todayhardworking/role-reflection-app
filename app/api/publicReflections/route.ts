import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { deriveTitleFromText } from "@/lib/reflections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("reflections")
      .where("isPublic", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    const reflections = snapshot.docs.map((doc) => {
      const data = doc.data() as {
        text?: string;
        title?: string;
        createdAt?: FirebaseFirestore.Timestamp | string;
        rolesInvolved?: string[];
        roles?: string[];
        isAnonymous?: boolean;
        likes?: number;
        likedBy?: Record<string, boolean>;
        rateLimit?: Record<string, number>;
      };

      const createdAtValue = data?.createdAt;
      const createdAt = createdAtValue
        ? typeof (createdAtValue as FirebaseFirestore.Timestamp).toDate === "function"
          ? (createdAtValue as FirebaseFirestore.Timestamp).toDate().toISOString()
          : (createdAtValue as string)
        : "";

      return {
        id: doc.id,
        title: deriveTitleFromText(data?.text ?? "", data?.title),
        text: data?.text ?? "",
        createdAt,
        rolesInvolved: data?.rolesInvolved ?? data?.roles ?? [],
        isAnonymous: data?.isAnonymous ?? true,
        likes: typeof data?.likes === "number" ? data.likes : 0,
        likedBy: data?.likedBy ?? {},
        rateLimit: data?.rateLimit ?? {},
      };
    });

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Error loading public reflections:", error);
    return NextResponse.json(
      { error: "Failed to load public reflections" },
      { status: 500 },
    );
  }
}
