"use client";

import LikeButton from "@/components/LikeButton";
import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import { formatSmartTimestamp } from "@/lib/date";
import { LikedPublicReflection, loadUserLikedReflections } from "@/lib/reflections";
import Link from "next/link";
import { useEffect, useState } from "react";

function buildPreview(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function MyLikesPage() {
  const { currentUser } = useUser();
  const [likedReflections, setLikedReflections] = useState<LikedPublicReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLikes = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);

      try {
        const reflections = await loadUserLikedReflections(currentUser.uid);
        const getTime = (value: string) => {
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        };
        const sorted = reflections
          .slice()
          .sort((a, b) => getTime(b.likedAt ?? "") - getTime(a.likedAt ?? ""));
        setLikedReflections(sorted);
      } catch (err) {
        console.error(err);
        setError("Unable to load your liked reflections right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadLikes();
  }, [currentUser]);

  if (isLoading) {
    return <p className="text-center text-slate-600">Loading your likes...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  if (!likedReflections.length) {
    return (
      <section className="space-y-3 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">My Likes</h1>
        <p className="text-sm text-slate-600">You haven’t liked any reflections yet.</p>
        <Link
          href="/public"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Explore public reflections
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-slate-500">Your saved favorites</p>
        <h1 className="text-3xl font-semibold text-slate-900">My Likes</h1>
        <p className="text-sm text-slate-600">Reflections you’ve liked most recently appear first.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {likedReflections.map((reflection) => {
          const preview = buildPreview(reflection.text);
          const likeCount = typeof reflection.likes === "number" ? reflection.likes : 0;

          return (
            <article
              key={reflection.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <Link href={`/public/${reflection.id}`} className="space-y-2 block">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {formatSmartTimestamp(reflection.createdAt)}
                  </p>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">
                    Liked on {formatSmartTimestamp(reflection.likedAt)}
                  </p>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 line-clamp-2">
                  {reflection.title || "Reflection"}
                </h2>
                <p className="text-slate-600 line-clamp-2">{preview}</p>
                {reflection.rolesInvolved && reflection.rolesInvolved.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reflection.rolesInvolved.map((role) => (
                      <span
                        key={role}
                        className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>Shared by: {reflection.isAnonymous ? "Anonymous" : "User"}</span>
                <span className="inline-flex items-center gap-1 text-slate-700">
                  <span aria-hidden>👍</span>
                  {likeCount}
                </span>
              </div>
              <div className="mt-3">
                <LikeButton
                  reflectionId={reflection.id}
                  initialLikes={likeCount}
                  userLiked
                  currentUser={currentUser}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default withAuth(MyLikesPage);
