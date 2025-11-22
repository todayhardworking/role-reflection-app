"use client";

import { useUser } from "@/context/UserContext";
import { loadReflection, updateReflection } from "@/lib/reflections";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function EditReflectionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currentUser, loading } = useUser();

  const reflectionId = useMemo(() => params?.id, [params]);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const fetchReflection = async () => {
      if (!currentUser || !reflectionId) return;

      try {
        setIsLoading(true);
        const reflection = await loadReflection(reflectionId, currentUser.uid);
        setTitle(reflection.title);
        setText(reflection.text);
      } catch (err) {
        console.error(err);
        setError("Unable to load reflection. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReflection();
  }, [currentUser, reflectionId]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentUser || !reflectionId) return;

    try {
      setIsSaving(true);
      setError(null);
      await updateReflection(reflectionId, currentUser.uid, text.trim(), title.trim());
      router.push(`/reflection/${reflectionId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!reflectionId) return;
    router.push(`/reflection/${reflectionId}`);
  };

  if (loading || !currentUser || isLoading) {
    return <p className="text-center text-slate-600">Loading reflection...</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Edit your reflection</p>
        <h2 className="text-2xl font-semibold text-slate-900">Update Reflection</h2>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-slate-800">
            Reflection Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-semibold text-slate-900 w-full border border-slate-200 rounded-md px-3 py-2 outline-none placeholder-slate-400"
            placeholder="Title (optional — if left empty, the first 1–2 lines will be used)"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="reflection" className="text-sm font-semibold text-slate-800">
            Reflection Text
          </label>
          <textarea
            id="reflection"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={8}
            className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
