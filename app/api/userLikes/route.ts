import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

function toISOString(value?: FirebaseFirestore.Timestamp | string) {
  if (!value) return "";
  if (typeof (value as FirebaseFirestore.Timestamp).toDate === "function") {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString();
  }
  return value as string;
}

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const likesSnapshot = await adminDb
      .collection("userLikes")
      .doc(uid)
      .collection("reflections")
      .orderBy("createdAt", "desc")
      .get();

    const likedEntries = likesSnapshot.docs.map((doc) => ({
      reflectionId: doc.id,
      likedAt: toISOString((doc.data() as { createdAt?: FirebaseFirestore.Timestamp | string })?.createdAt),
    }));

    if (likedEntries.length === 0) {
      return NextResponse.json({ reflections: [] });
    }

    const reflectionSnapshots = await Promise.all(
      likedEntries.map((entry) => adminDb.collection("reflections").doc(entry.reflectionId).get()),
    );

    const likedAtById = new Map(likedEntries.map((entry) => [entry.reflectionId, entry.likedAt]));

    const reflections = reflectionSnapshots
      .map((snapshot) => {
        if (!snapshot.exists) return null;

        const data = (snapshot.data() ?? {}) as {
          id?: string;
          title?: string;
          text?: string;
          createdAt?: FirebaseFirestore.Timestamp | string;
          rolesInvolved?: string[];
          roles?: string[];
          isAnonymous?: boolean;
          isPublic?: boolean;
          suggestions?: Record<string, unknown> | null;
          likes?: number;
          likedBy?: Record<string, boolean>;
        };

        const createdAtValue = toISOString(data.createdAt);
        const reflection = {
          id: data.id ?? snapshot.id,
          title: data.title ?? "",
          text: data.text ?? "",
          createdAt: createdAtValue || new Date().toISOString(),
          rolesInvolved: data.rolesInvolved ?? [],
          isAnonymous: data.isAnonymous ?? false,
          isPublic: data.isPublic ?? false,
          suggestions: data.suggestions ?? null,
          likes: data.likes ?? 0,
          likedBy: data.likedBy ?? {},
          likedAt: likedAtById.get(snapshot.id) ?? new Date(0).toISOString(),
        };

        if (!reflection.isPublic) return null;

        return reflection;
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Error loading liked reflections:", error);
    return NextResponse.json(
      { error: "Failed to load liked reflections" },
      { status: 500 },
    );
  }
}
