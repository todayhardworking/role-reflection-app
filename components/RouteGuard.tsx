"use client";

import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

const PUBLIC_ROUTES = new Set(["/signin", "/signup"]);

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { currentUser, loading } = useUser();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (loading) return;

    if (!currentUser && !isPublicRoute) {
      router.replace("/signin");
    }

    if (currentUser && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [currentUser, isPublicRoute, loading, router]);

  if (loading) {
    if (isPublicRoute) {
      return <>{children}</>;
    }

    return <p className="text-center text-slate-600">Checking your session...</p>;
  }

  if (!currentUser && !isPublicRoute) {
    return <p className="text-center text-slate-600">Redirecting to sign in...</p>;
  }

  return <>{children}</>;
}
