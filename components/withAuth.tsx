"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import React, { ComponentType, useEffect, useMemo, useState } from "react";

type IconProps = { className?: string };

function Bars3Icon({ className }: IconProps) {
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

function XMarkIcon({ className }: IconProps) {
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

function HomeIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75 12 3l9 6.75V21H3z" />
    </svg>
  );
}

function PencilSquareIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487 19.5 7.125m-2.638-2.638-9.75 9.75a4.5 4.5 0 0 0-1.17 2.025L5.25 19.5l3.238-.692a4.5 4.5 0 0 0 2.025-1.17l9.75-9.75m-2.638-2.638a1.875 1.875 0 1 1 2.652 2.652m-2.652-2.652L12.75 2.25 9 6m0 0H4.5a2.25 2.25 0 0 0-2.25 2.25v11.25A2.25 2.25 0 0 0 4.5 21H15.75A2.25 2.25 0 0 0 18 18.75V12"
      />
    </svg>
  );
}

function BookOpenIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75c-2.083-1.05-4.158-1.57-6.225-1.57C4.05 5.18 3 6.24 3 7.545v9.352c0 1.053.854 1.903 1.907 1.903 2.33 0 4.36.363 6.243 1.6m0-13.65c2.083-1.05 4.158-1.57 6.225-1.57C19.95 5.18 21 6.24 21 7.545v9.352c0 1.053-.854 1.903-1.907 1.903-2.33 0-4.36.363-6.243 1.6" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3.75V6M17.25 3.75V6M4.5 9.75h15m-12.75 9.75h10.5A2.25 2.25 0 0 0 19.5 17.25v-9a2.25 2.25 0 0 0-2.25-2.25h-10.5A2.25 2.25 0 0 0 4.5 8.25v9a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function HandThumbUpIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.75 4.5c0 .966-.784 1.75-1.75 1.75H8.25a2.25 2.25 0 0 0-2.25 2.25v7.5A2.25 2.25 0 0 0 8.25 18H15a2.25 2.25 0 0 0 2.25-2.25v-5.5A2.75 2.75 0 0 0 14.5 7.5h-1.91c-.203 0-.398-.08-.542-.224l-.888-.888a1.25 1.25 0 0 1-.37-.888Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 9.75h-1.5A1.75 1.75 0 0 0 2 11.5v4a1.75 1.75 0 0 0 1.75 1.75h1.5V9.75Z"
      />
    </svg>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9Zm0 0c2.761 0 5 4.03 5 9s-2.239 9-5 9-5-4.03-5-9 2.239-9 5-9Zm0 0a8.966 8.966 0 0 0-6.364 2.636C7.788 7.788 9.825 9 12 9c2.175 0 4.212-1.212 6.364-3.364A8.966 8.966 0 0 0 12 3Zm0 12c-2.175 0-4.212 1.212-6.364 3.364A8.966 8.966 0 0 0 12 21a8.966 8.966 0 0 0 6.364-2.636C16.212 16.212 14.175 15 12 15Z"
      />
    </svg>
  );
}

function ArrowRightOnRectangleIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-4.5-3h9m0 0-3-3m3 3-3 3"
      />
    </svg>
  );
}

interface NavItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
) {
  function ComponentWithAuth(props: P) {
    const { currentUser, loading, signOut } = useUser();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
      if (!loading && !currentUser) {
        router.replace("/signin");
      }
    }, [currentUser, loading, router]);

    const navItems = useMemo<NavItem[]>(
      () => [
        {
          label: "Dashboard",
          icon: HomeIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/dashboard");
          },
        },
        {
          label: "New Reflection",
          icon: PencilSquareIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/reflection/new");
          },
        },
        {
          label: "Reflections",
          icon: BookOpenIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/reflections");
          },
        },
        {
          label: "My Likes",
          icon: HandThumbUpIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/my-likes");
          },
        },
        {
          label: "Weekly History",
          icon: CalendarIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/weekly/summary");
          },
        },
        {
          label: "Public Reflections",
          icon: GlobeIcon,
          action: () => {
            setIsDrawerOpen(false);
            router.push("/public");
          },
        },
        {
          label: "Sign Out",
          icon: ArrowRightOnRectangleIcon,
          action: async () => {
            setIsDrawerOpen(false);
            await signOut();
            router.replace("/signin");
          },
        },
      ],
      [router, signOut],
    );

    if (loading) {
      return <LoadingState message="Loading your session..." />;
    }

    if (!currentUser) {
      return <LoadingState message="Redirecting to sign in..." />;
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <span className="text-lg font-semibold text-slate-900">Revo Reflect</span>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1 rounded-md hover:bg-slate-100 transition"
            aria-label="Open navigation menu"
          >
            <Bars3Icon className="h-7 w-7 text-slate-800" />
          </button>
        </header>

        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
          <WrappedComponent {...props} />
        </div>

        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40"
            aria-hidden="true"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 right-0 z-40 h-full w-[280px] transform bg-white shadow-2xl transition-transform duration-300 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Revo Reflect – AI Role Reflection App
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
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
                    onClick={item.action}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    );
  }

  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  (ComponentWithAuth as React.ComponentType<P>).displayName = `withAuth(${wrappedName})`;

  return ComponentWithAuth as React.ComponentType<P>;
}
