"use client";

import { useState } from "react";
import type { User } from "firebase/auth";

interface LikeButtonProps {
  reflectionId: string;
  initialLikes: number;
  userLiked: boolean;
  currentUser: User | null;
}

export function LikeButton({
  reflectionId,
  initialLikes,
  userLiked,
  currentUser,
}: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(Number.isFinite(initialLikes) ? initialLikes : 0);
  const [hasLiked, setHasLiked] = useState<boolean>(userLiked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLike = async () => {
    if (hasLiked) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/likeReflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflectionId, uid: currentUser?.uid ?? null }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Failed to like reflection");
      }

      if (body?.alreadyLiked) {
        setHasLiked(true);
        setLikes((prev) => (typeof body?.likes === "number" ? body.likes : prev));
        return;
      }

      if (typeof body?.likes === "number") {
        setLikes(body.likes);
      }

      setHasLiked(true);
    } catch (err) {
      console.error(err);
      setError("Unable to like right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = hasLiked || isSubmitting;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleLike();
        }}
        disabled={isDisabled}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
          isDisabled
            ? "bg-slate-200 text-slate-600 cursor-not-allowed"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
        aria-pressed={hasLiked}
      >
        <span aria-hidden>👍</span>
        {hasLiked ? "Liked ✓" : "Like"}
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold">{likes}</span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default LikeButton;
