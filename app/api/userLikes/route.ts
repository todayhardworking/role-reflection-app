import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { deriveTitleFromText } from "@/lib/reflections";

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

    const reflectionsById = new Map(
      reflectionSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => {
          const data = snapshot.data() as {
            text?: string;
            title?: string;
            createdAt?: FirebaseFirestore.Timestamp | string;
            rolesInvolved?: string[];
            roles?: string[];
            isAnonymous?: boolean;
            isPublic?: boolean;
            suggestions?: Record<string, unknown> | null;
            likes?: number;
            likedBy?: Record<string, boolean>;
          };

          const createdAt = toISOString(data?.createdAt);

          return [
            snapshot.id,
            {
              id: snapshot.id,
              title: deriveTitleFromText(data?.text ?? "", data?.title),
              text: data?.text ?? "",
              createdAt,
              rolesInvolved: data?.rolesInvolved ?? data?.roles ?? [],
              isAnonymous: data?.isAnonymous ?? true,
              isPublic: data?.isPublic ?? false,
              suggestions: (data?.suggestions as Record<string, unknown> | null) ?? null,
              likes: typeof data?.likes === "number" ? data.likes : 0,
              likedBy: data?.likedBy ?? {},
            },
          ];
        }),
    );

    const reflections = likedEntries
      .map((entry) => {
        const reflection = reflectionsById.get(entry.reflectionId);
        if (!reflection || !reflection.isPublic) return null;

        return {
          ...reflection,
          likedAt: entry.likedAt || new Date(0).toISOString(),
        };
      })
      .filter(
        (
          value,
        ): value is {
          id: string;
          title: string;
          text: string;
          createdAt: string;
          rolesInvolved: string[];
          isAnonymous: boolean;
          suggestions: Record<string, unknown> | null;
          likes: number;
          likedBy?: Record<string, boolean>;
          likedAt: string;
        } => Boolean(value),
      );

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Error loading liked reflections:", error);
    return NextResponse.json(
      { error: "Failed to load liked reflections" },
      { status: 500 },
    );
  }
}
