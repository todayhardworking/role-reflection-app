"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatActiveDuration } from "@/lib/formatTime";
import { type DashboardStats } from "@/lib/types";

interface MenuCard {
  title: string;
  description: string;
  href?: string;
  action?: () => void;
}

function DashboardPage() {
  const { currentUser, signOut } = useUser();
  const router = useRouter();

  const [showInitialDeleteConfirm, setShowInitialDeleteConfirm] = useState(false);
  const [showFinalDeleteConfirm, setShowFinalDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const menuCards: MenuCard[] = useMemo(
    () => [
      {
        title: "Add Reflection",
        description: "Capture a new reflection while it is fresh in your mind.",
        href: "/reflection/new",
      },
      {
        title: "View Reflections List",
        description: "Browse all of your past reflections in one place.",
        href: "/reflections",
      },
      {
        title: "Weekly Reports",
        description: "View your AI weekly reflections",
        href: "/weekly/summary",
      },
      {
        title: "Monthly Reports",
        description: "Your monthly AI insights and trend analysis",
        href: "/monthly/summary",
      },
      {
        title: "Manage Roles",
        description: "Update the roles that guide your reflections and coaching.",
        href: "/roles",
      },
      {
        title: "Delete Account & Data",
        description: "Remove your account and all stored reflections permanently.",
        action: () => {
          setShowInitialDeleteConfirm(true);
          setError(null);
        },
      },
    ],
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        setLoadingStats(true);
        setStatsError(null);
        const token = await currentUser.getIdToken(true);
        const response = await fetch("/api/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load statistics");
        }

        const payload = (await response.json()) as DashboardStats;

        if (isMounted) {
          setStats(payload);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setStatsError("Unable to load statistics. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);
      setError(null);

      const token = await currentUser.getIdToken(true);

      const response = await fetch("/api/deleteAccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to delete account");
      }

      await signOut();
      router.replace("/signin");
    } catch (err) {
      console.error(err);
      setError("Unable to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteInput("");
      setShowFinalDeleteConfirm(false);
      setShowInitialDeleteConfirm(false);
    }
  };

  const closeModals = () => {
    setShowInitialDeleteConfirm(false);
    setShowFinalDeleteConfirm(false);
    setDeleteInput("");
    setError(null);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Welcome back</p>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-slate-700">You are signed in as {currentUser.email}</p>
        </div>
        <button
          onClick={signOut}
          className="self-start rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Sign Out
        </button>
      </header>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Statistics</h3>
        {statsError && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{statsError}</p>
        )}
        {loadingStats ? (
          <p className="text-sm text-slate-600">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Reflections</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {stats?.totalReflections ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Public Reflections</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {stats?.totalPublicReflections ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Likes Received</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {stats?.totalLikesReceived ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>This Week / This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg font-semibold text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">This Week</span>
                  <span className="text-2xl text-slate-900">{stats?.reflectionsThisWeek ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">This Month</span>
                  <span className="text-2xl text-slate-900">{stats?.reflectionsThisMonth ?? "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Days with RevoReflect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-slate-800">
                <div className="text-3xl font-bold">
                  {formatActiveDuration(stats?.daysWithRevo ?? 0)}
                </div>
                {stats?.accountCreatedAt && (
                  <p className="text-sm text-slate-600">
                    Since {new Date(stats.accountCreatedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {menuCards.map((card) => {
          const content = (
            <>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="text-slate-600">{card.description}</p>
              </div>
              <span className="text-sm font-semibold text-slate-700 transition group-hover:text-slate-900">
                {card.href ? "Go" : "Continue"} ↗
              </span>
            </>
          );

          return card.href ? (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex min-h-[160px] flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {content}
            </Link>
          ) : (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className="group relative flex min-h-[160px] flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {content}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {showInitialDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Delete account?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInitialDeleteConfirm(false);
                  setShowFinalDeleteConfirm(true);
                  setError(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Final confirmation</h3>
            <p className="text-sm text-slate-600">
              Type <span className="font-semibold">DELETE</span> to permanently delete your account and all your data.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "DELETE" || isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default withAuth(DashboardPage);
