import { ReactNode } from "react";

interface SharedLayoutProps {
  children: ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Role Reflection App</h1>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
          Built with Next.js 14 and Tailwind CSS
        </footer>
      </div>
    </div>
  );
}
