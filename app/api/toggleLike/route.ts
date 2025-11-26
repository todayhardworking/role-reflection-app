import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

interface ToggleLikeRequestBody {
  reflectionId?: string;
  actorId?: string;
  uid?: string | null;
}

export async function POST(request: Request) {
  try {
    const { reflectionId, actorId, uid }: ToggleLikeRequestBody = await request.json();

    if (!reflectionId || !actorId) {
      return NextResponse.json({ error: "Missing reflectionId or actorId" }, { status: 400 });
    }

    const reflectionRef = adminDb.collection("reflections").doc(reflectionId);

    const transactionResult = await adminDb.runTransaction(async (tx) => {
      const snapshot = await tx.get(reflectionRef);

      if (!snapshot.exists) {
        throw new Error("REFLECTION_NOT_FOUND");
      }

      const data = (snapshot.data() ?? {}) as {
        likedBy?: Record<string, boolean>;
        likes?: number;
        rateLimit?: Record<string, number>;
      };

      const likedBy = (data.likedBy ?? {}) as Record<string, boolean>;
      const likes = typeof data.likes === "number" ? data.likes : 0;
      const rateLimit = (data.rateLimit ?? {}) as Record<string, number>;

      const alreadyLiked = likedBy[actorId] === true;
      const now = Date.now();
      const lastLikeTs = typeof rateLimit[actorId] === "number" ? rateLimit[actorId] : 0;

      if (!alreadyLiked) {
        if (now - lastLikeTs < 60_000) {
          throw new Error("RATE_LIMIT");
        }

        likedBy[actorId] = true;
        const updatedLikes = likes + 1;
        rateLimit[actorId] = now;

        tx.update(reflectionRef, {
          likedBy,
          likes: updatedLikes,
          rateLimit,
        });

        if (uid) {
          const userLikeRef = adminDb
            .collection("userLikes")
            .doc(uid)
            .collection("reflections")
            .doc(reflectionId);

          tx.set(userLikeRef, {
            createdAt: new Date(now).toISOString(),
          });
        }

        return { likes: updatedLikes, isLiked: true };
      }

      delete likedBy[actorId];
      const updatedLikes = Math.max(0, likes - 1);

      tx.update(reflectionRef, {
        likedBy,
        likes: updatedLikes,
        rateLimit,
      });

      if (uid) {
        const userLikeRef = adminDb
          .collection("userLikes")
          .doc(uid)
          .collection("reflections")
          .doc(reflectionId);

        tx.delete(userLikeRef);
      }

      return { likes: updatedLikes, isLiked: false };
    });

    const updatedSnapshot = await reflectionRef.get();
    const updatedData = (updatedSnapshot.data() ?? {}) as {
      likedBy?: Record<string, boolean>;
      likes?: number;
    };

    const updatedLikes = typeof updatedData.likes === "number" ? updatedData.likes : transactionResult.likes;
    const updatedLikedBy = (updatedData.likedBy ?? {}) as Record<string, boolean>;

    return NextResponse.json({
      likes: updatedLikes ?? 0,
      isLiked: Boolean(updatedLikedBy[actorId]),
    });
  } catch (error) {
    if ((error as Error).message === "REFLECTION_NOT_FOUND") {
      return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
    }

    if ((error as Error).message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "Rate limit: You can only like this reflection once per 60 seconds." },
        { status: 429 },
      );
    }

    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
