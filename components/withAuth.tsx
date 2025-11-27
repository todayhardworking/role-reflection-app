"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect } from "react";

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  function ComponentWithAuth(props: P) {
    const { currentUser, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !currentUser) {
        router.replace("/signin");
      }
    }, [currentUser, loading, router]);

    if (loading) {
      return <LoadingState message="Loading your session..." />;
    }

    if (!currentUser) {
      return <LoadingState message="Redirecting to sign in..." />;
    }

    return <WrappedComponent {...props} />;
  }

  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  (ComponentWithAuth as ComponentType<P>).displayName = `withAuth(${wrappedName})`;

  return ComponentWithAuth as ComponentType<P>;
}
