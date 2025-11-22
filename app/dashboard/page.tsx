"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

  const menuCards: MenuCard[] = useMemo(
    () => [
      {
        title: "Add Reflection",
        description: "Capture a new reflection while it&apos;s fresh in your mind.",
        href: "/reflection/new",
      },
      {
        title: "View Reflections List",
        description: "Browse all of your past reflections in one place.",
        href: "/reflections",
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
