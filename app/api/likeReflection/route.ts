import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { reflectionId, uid } = await request.json();

    if (!reflectionId) {
      return NextResponse.json({ error: "Missing reflectionId" }, { status: 400 });
    }

    const reflectionRef = adminDb.collection("reflections").doc(reflectionId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reflectionRef);

      if (!snapshot.exists) {
        throw new Error("REFLECTION_NOT_FOUND");
      }

      const data = snapshot.data() as {
        likes?: number;
        likedBy?: Record<string, boolean>;
      };

      const currentLikes = typeof data?.likes === "number" ? data.likes : 0;
      const likedBy = (data?.likedBy as Record<string, boolean> | undefined) ?? {};

      if (uid) {
        if (likedBy[uid]) {
          return { alreadyLiked: true, likes: currentLikes };
        }

        const updatedLikes = currentLikes + 1;
        transaction.update(reflectionRef, {
          likes: updatedLikes,
          likedBy: { ...likedBy, [uid]: true },
        });

        const userLikeRef = adminDb
          .collection("userLikes")
          .doc(uid)
          .collection("reflections")
          .doc(reflectionId);

        transaction.set(userLikeRef, {
          createdAt: new Date().toISOString(),
        });

        return { likes: updatedLikes };
      }

      const updatedLikes = currentLikes + 1;
      transaction.update(reflectionRef, { likes: updatedLikes });
      return { likes: updatedLikes };
    });

    if (result?.alreadyLiked) {
      return NextResponse.json({ ok: false, alreadyLiked: true, likes: result.likes });
    }

    return NextResponse.json({ success: true, likes: result?.likes ?? 0 });
  } catch (error) {
    if ((error as Error)?.message === "REFLECTION_NOT_FOUND") {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    console.error("Error liking reflection:", error);
    return NextResponse.json(
      { error: "Failed to like reflection" },
      { status: 500 },
    );
  }
}
