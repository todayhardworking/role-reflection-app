"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { currentUser, loading, signOut } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [loading, currentUser, router]);

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
    </section>
  );
}
