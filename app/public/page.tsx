"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSmartTimestamp } from "@/lib/date";
import { loadPublicReflections } from "@/lib/reflections";

export const dynamic = "force-dynamic";

function buildPreview(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

export default function PublicReflectionsPage() {
  const [reflections, setReflections] = useState<Awaited<ReturnType<typeof loadPublicReflections>>>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadPublicReflections()
      .then((data) => {
        if (isMounted) {
          setReflections(data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setError(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Public Reflections</h1>
        <p className="text-sm text-red-600">Unable to load public reflections right now.</p>
      </section>
    );
  }

    return (
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Public Reflections</h1>
          <p className="text-sm text-slate-600">
            Explore reflections shared by the community.
          </p>
        </header>

        {reflections.length === 0 ? (
          <p className="text-center text-slate-600">No public reflections yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reflections.map((reflection) => {
              const preview = buildPreview(reflection.text);

              return (
                <Link
                  key={reflection.id}
                  href={`/public/${reflection.id}`}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {formatSmartTimestamp(reflection.createdAt)}
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
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    Shared by: {reflection.isAnonymous ? "Anonymous" : "User"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    );
}
