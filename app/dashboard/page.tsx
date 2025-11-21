"use client";

import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { loadReflections, type Reflection } from "@/lib/reflections";

export default function DashboardPage() {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);

  useEffect(() => {
    if (!userContext) return;

    const { loading, currentUser } = userContext;

    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [userContext, router]);

  useEffect(() => {
    if (!userContext) return;

    const { loading, currentUser } = userContext;

    if (loading || !currentUser) return;

    const fetchReflections = async () => {
      try {
        setIsLoadingReflections(true);
        const data = await loadReflections(currentUser.uid);
        setReflections(data);
      } catch (error) {
        console.error("Failed to load reflections", error);
      } finally {
        setIsLoadingReflections(false);
      }
    };

    fetchReflections();
  }, [userContext]);

  if (!userContext) {
    return <p className="text-center text-slate-600">Loading your dashboard...</p>;
  }

  const { currentUser, loading, signOut } = userContext;

  if (loading || !currentUser) {
    return <p className="text-center text-slate-600">Loading your dashboard...</p>;
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Welcome back</p>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        </div>
        <button
          onClick={signOut}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Sign Out
        </button>
      </header>
      <p className="text-slate-700">
        You are signed in as <span className="font-medium">{currentUser.email}</span>. Head over to the
        reflection page to capture your thoughts.
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Your reflections</h3>
          {isLoadingReflections && <span className="text-sm text-slate-500">Loading...</span>}
        </div>
        {reflections.length === 0 && !isLoadingReflections ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
            You haven&apos;t saved any reflections yet. Head over to the reflection page to start capturing your thoughts.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {reflections.map((reflection) => (
              <li key={reflection.id} className="space-y-1 p-4">
                <p className="text-slate-800">{reflection.text}</p>
                <p className="text-sm text-slate-500">
                  {new Date(reflection.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
