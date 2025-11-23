import Link from "next/link";
import { formatSmartTimestamp } from "@/lib/date";
import { loadPublicReflection } from "@/lib/reflections";

export const dynamic = "force-dynamic";

export default async function PublicReflectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const reflection = await loadPublicReflection(params.id);
    const suggestionEntries = Object.entries(reflection.suggestions ?? {}).filter(
      ([, value]) =>
        !value?.suggestion?.toLowerCase?.().includes("not applicable") &&
        !value?.title?.toLowerCase?.().includes("not applicable"),
    );

    return (
      <section className="space-y-6">
        <Link
          href="/public"
          className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back to Public Reflections
        </Link>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">
              {reflection.title || "Reflection"}
            </h1>
            <p className="text-sm text-slate-600">
              {formatSmartTimestamp(reflection.createdAt)} · Shared by: {reflection.isAnonymous ? "Anonymous" : "User"}
            </p>
            {reflection.rolesInvolved && reflection.rolesInvolved.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reflection.rolesInvolved.map((role) => (
                  <span
                    key={role}
                    className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Reflection</h2>
            <p className="whitespace-pre-wrap text-slate-800">{reflection.text}</p>
          </div>

          {suggestionEntries.length > 0 && (
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">AI Suggestions</h3>
              <div className="space-y-2">
                {suggestionEntries.map(([role, suggestion]) => (
                  <details key={role} className="group rounded-md border border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800">
                      <span>
                        {role} — {suggestion.title}
                      </span>
                      <span className="text-lg text-slate-500 group-open:hidden">+</span>
                      <span className="text-lg text-slate-500 hidden group-open:inline">−</span>
                    </summary>
                    <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                      <p className="whitespace-pre-wrap">{suggestion.suggestion}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  } catch (error) {
    console.error(error);
    return (
      <section className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Public Reflection</h1>
        <p className="text-sm text-slate-600">This reflection is unavailable or is no longer public.</p>
        <Link
          href="/public"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go back
        </Link>
      </section>
    );
  }
}
