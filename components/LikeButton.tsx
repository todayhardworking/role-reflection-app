"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";

interface LikeButtonProps {
  reflectionId: string;
  initialLikes: number;
  initialLikedBy?: Record<string, boolean>;
  currentUser: User | null;
}

export function LikeButton({
  reflectionId,
  initialLikes,
  initialLikedBy,
  currentUser,
}: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(Number.isFinite(initialLikes) ? initialLikes : 0);
  const [actorId, setActorId] = useState<string | null>(() => currentUser?.uid ?? null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrCreateActorId = useCallback(() => {
    if (currentUser?.uid) {
      return currentUser.uid;
    }

    if (typeof window === "undefined") {
      return null;
    }

    const existing = window.localStorage.getItem("revo_reflect_anonId");

    if (existing) {
      return existing;
    }

    const anonId = `anon_${crypto.randomUUID()}`;
    window.localStorage.setItem("revo_reflect_anonId", anonId);
    return anonId;
  }, [currentUser?.uid]);

  useEffect(() => {
    const id = getOrCreateActorId();
    if (id) {
      setActorId(id);
    }
  }, [getOrCreateActorId]);

  useEffect(() => {
    if (!actorId) return;
    setIsLiked(Boolean((initialLikedBy ?? {})[actorId]));
  }, [actorId, initialLikedBy]);

  const handleToggleLike = async () => {
    const resolvedActorId = getOrCreateActorId();
    if (!resolvedActorId) return;

    setActorId(resolvedActorId);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/toggleLike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflectionId,
          actorId: resolvedActorId,
          uid: currentUser?.uid ?? null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Unable to toggle like";
        setError(message);
        console.error("Toggle like failed", message);
        return;
      }

      if (typeof data.likes === "number") {
        setLikes(data.likes);
      }

      if (typeof data.isLiked === "boolean") {
        setIsLiked(data.isLiked);
      }
    } catch (err) {
      console.error("Toggle like error", err);
      setError("Unable to toggle like right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!isSubmitting) {
            void handleToggleLike();
          }
        }}
        className={`flex items-center gap-1 text-sm font-medium cursor-pointer transition ${
          isLiked ? "text-blue-600" : "text-slate-600 hover:text-slate-800"
        } ${isSubmitting ? "opacity-60" : ""}`}
        aria-pressed={isLiked}
        disabled={isSubmitting}
      >
        <span className="text-lg" aria-hidden>
          👍
        </span>
        <span>{likes}</span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default LikeButton;
