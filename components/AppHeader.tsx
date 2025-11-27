"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";

function Bars3Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

interface NavItem {
  label: string;
  action: () => void | Promise<void>;
}

export default function AppHeader() {
  const { currentUser, signOut } = useUser();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(() => {
    if (!currentUser) {
      return [
        { label: "Home", action: () => router.push("/") },
        { label: "Public Reflections", action: () => router.push("/public") },
        { label: "Sign In", action: () => router.push("/signin") },
        { label: "Register", action: () => router.push("/register") },
      ];
    }

    return [
      { label: "Dashboard", action: () => router.push("/dashboard") },
      { label: "New Reflection", action: () => router.push("/reflection/new") },
      { label: "Reflections", action: () => router.push("/reflections") },
      { label: "Weekly Reports", action: () => router.push("/weekly/summary") },
      { label: "Public Reflections", action: () => router.push("/public") },
      { label: "Manage Roles", action: () => router.push("/roles") },
      {
        label: "Sign Out",
        action: async () => {
          await signOut();
          router.replace("/signin");
        },
      },
    ];
  }, [currentUser, router, signOut]);

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleItemClick = async (action: NavItem["action"]) => {
    closeDrawer();
    await action();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-slate-900 hover:text-slate-700">
          Revo Reflect
        </Link>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="rounded-md p-2 text-slate-800 transition hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-7 w-7" />
        </button>
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          onClick={closeDrawer}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[280px] max-w-full transform bg-white shadow-2xl transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Revo Reflect – AI Role Reflection App</div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded p-1 text-slate-700 transition hover:bg-slate-100"
            aria-label="Close navigation menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-3">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item.action)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <span>{item.label}</span>
                  <span className="text-slate-400">→</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </header>
  );
}
