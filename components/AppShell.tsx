"use client";

import { useUser } from "@/context/UserContext";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BookOpenIcon,
  HomeIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

function isAuthAwareElement(child: ReactNode): child is ReactElement & {
  type: { authRequired?: boolean };
} {
  return isValidElement(child) && typeof child.type === "function";
}

function getAuthRequired(children: ReactNode) {
  const [firstChild] = Children.toArray(children);

  if (isAuthAwareElement(firstChild)) {
    return Boolean(firstChild.type.authRequired);
  }

  return false;
}

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", Icon: HomeIcon },
  { label: "Add Reflection", href: "/reflection/new", Icon: PencilSquareIcon },
  { label: "Reflections List", href: "/reflections", Icon: BookOpenIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, loading, signOut } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const authRequired = useMemo(() => getAuthRequired(children), [children]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!authRequired || loading) return;

    if (!currentUser) {
      router.replace("/signin");
    }
  }, [authRequired, currentUser, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    setIsDrawerOpen(false);
    router.replace("/signin");
  };

  const shouldShowHeader = authRequired;
  const shouldShowBurger = shouldShowHeader && Boolean(currentUser);

  if (authRequired && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-slate-700">Checking your session...</p>
      </div>
    );
  }

  if (authRequired && !loading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-slate-700">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {shouldShowHeader && (
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <div className="text-lg font-semibold text-slate-900">Revo Reflect</div>
          {shouldShowBurger && (
            <button type="button" onClick={() => setIsDrawerOpen(true)} aria-label="Open navigation menu">
              <Bars3Icon className="h-7 w-7 cursor-pointer text-slate-800" />
            </button>
          )}
        </header>
      )}

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
          Built with Next.js 14 and Tailwind CSS
        </footer>
      </div>

      {shouldShowHeader && (
        <>
          <div
            className={`fixed inset-0 bg-black/30 transition-opacity ${
              isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            className={`fixed right-0 top-0 h-full w-[280px] transform bg-white shadow-2xl transition-transform duration-300 ${
              isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-4">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Revo Reflect – AI Role Reflection App</h2>
                <button type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation menu">
                  <XMarkIcon className="h-6 w-6 text-slate-800" />
                </button>
              </div>

              <nav className="space-y-2">
              {navigationItems.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-md p-3 text-slate-800 transition hover:bg-slate-100"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md p-3 text-left text-slate-800 transition hover:bg-slate-100"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
              </nav>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
