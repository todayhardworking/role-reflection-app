import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl text-center text-slate-500">
        <Link href="/">
        <div className="text-lg font-semibold text-slate-600">Revo Reflect</div>
        </Link>  
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
          <Link href="/public" className="hover:text-slate-700">
            Public Reflections
          </Link>
          <span className="text-slate-400">|</span>
          <Link href="/privacy-policy" className="hover:text-slate-700">
            Privacy Policy
          </Link>
          <span className="text-slate-400">|</span>
          <Link href="/terms" className="hover:text-slate-700">
            Terms of Service
          </Link>
          <span className="text-slate-400">|</span>
          <Link href="/signin" className="hover:text-slate-700">
            Sign In / Register
          </Link>
        </nav>
        <p className="mt-4 text-xs text-slate-400">
          © 2025 Revo Reflect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
