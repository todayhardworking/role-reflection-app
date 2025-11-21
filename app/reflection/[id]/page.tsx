"use client";

import { useUser } from "@/context/UserContext";
import { loadReflection } from "@/lib/reflections";
import { generateSuggestions, loadSuggestions, type Suggestions } from "@/lib/suggestions";
import { loadRoles } from "@/lib/roles";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ReflectionDetailsState {
  text: string;
  createdAt: string | null;
}

export default function ReflectionDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currentUser, loading } = useUser();

  const [reflection, setReflection] = useState<ReflectionDetailsState | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reflectionId = useMemo(() => params?.id, [params]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !reflectionId) return;

      try {
        setIsLoading(true);
        setError(null);

        const [reflectionResponse, rolesResponse, suggestionsResponse] = await Promise.all([
          loadReflection(reflectionId, currentUser.uid),
          loadRoles(currentUser.uid),
          loadSuggestions(reflectionId),
        ]);

        setReflection({
          text: reflectionResponse.text,
          createdAt: reflectionResponse.createdAt,
        });
        setRoles(rolesResponse);
        setSuggestions(suggestionsResponse);
      } catch (err) {
        console.error(err);
        setError("Unable to load reflection details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, reflectionId]);

  const handleGenerateSuggestions = async () => {
    if (!currentUser || !reflectionId || !reflection || roles.length === 0) return;

    try {
      setIsGenerating(true);
      setError(null);

      const generated = await generateSuggestions(
        reflectionId,
        currentUser.uid,
        reflection.text,
        roles
      );

      setSuggestions(generated);
    } catch (err) {
      console.error(err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || !currentUser || isLoading) {
    return <p className="text-center text-slate-600">Loading reflection...</p>;
  }

  if (!reflection) {
    return <p className="text-center text-red-600">Reflection not found.</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Your saved reflection</p>
        <h2 className="text-2xl font-semibold text-slate-900">Reflection Details</h2>
        <p className="text-sm text-slate-500">
          {reflection.createdAt
            ? new Date(reflection.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Date unavailable"}
        </p>
      </header>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Reflection Text</h3>
        <p className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-800">
          {reflection.text}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || roles.length === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGenerating ? "Generating..." : "Generate AI Suggestions"}
          </button>
          {roles.length === 0 && (
            <span className="text-sm text-slate-500">Add roles to receive tailored suggestions.</span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {suggestions && Object.keys(suggestions).length > 0 && (
        <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">AI Suggestions</h3>
          <div className="space-y-3">
            {Object.entries(suggestions).map(([role, suggestion]) => (
              <div key={role} className="space-y-1 rounded-md border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-800">{role}</h4>
                <p className="text-sm text-slate-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
