"use client";

import withAuth from "@/components/withAuth";
import { useUser } from "@/context/UserContext";
import {
  deleteReflection,
  loadReflection,
  updateReflectionVisibility,
} from "@/lib/reflections";
import { generateSuggestions, loadSuggestions, type Suggestions } from "@/lib/suggestions";
import { loadRoles } from "@/lib/roles";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ReflectionDetailsState {
  title: string;
  text: string;
  createdAt: string;
  rolesInvolved?: string[];
  isPublic: boolean;
  isAnonymous: boolean;
}

function ReflectionDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currentUser, loading } = useUser();

  const [reflection, setReflection] = useState<ReflectionDetailsState | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const reflectionId = useMemo(() => params?.id, [params]);

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
          title: reflectionResponse.title,
          text: reflectionResponse.text,
          createdAt: reflectionResponse.createdAt,
          rolesInvolved: reflectionResponse.rolesInvolved,
          isPublic: reflectionResponse.isPublic,
          isAnonymous: reflectionResponse.isAnonymous,
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

  const handleEdit = () => {
    if (!reflectionId) return;

    router.push(`/reflection/${reflectionId}/edit`);
  };

  const handleDelete = async () => {
    if (!currentUser || !reflectionId) return;

    try {
      setIsDeleting(true);
      setError(null);
      await deleteReflection(reflectionId, currentUser.uid);
      router.push("/reflections");
    } catch (err) {
      console.error(err);
      setError("Failed to delete reflection. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleVisibilityUpdate = async (
    nextIsPublic: boolean,
    nextIsAnonymous: boolean,
  ) => {
    if (!currentUser || !reflectionId) return;

    const previous = reflection;

    setVisibilityError(null);
    setIsUpdatingVisibility(true);
    setReflection((prev) =>
      prev
        ? {
            ...prev,
            isPublic: nextIsPublic,
            isAnonymous: nextIsAnonymous,
          }
        : prev,
    );

    try {
      const token = await currentUser.getIdToken();
      await updateReflectionVisibility(
        reflectionId,
        nextIsPublic,
        nextIsAnonymous,
        token,
      );
    } catch (err) {
      console.error(err);
      setVisibilityError("Failed to update visibility. Please try again.");
      setReflection(previous);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const orderedSuggestions = useMemo(() => {
    if (!suggestions || roles.length === 0)
      return [] as { role: string; data: Suggestions[string] }[];

    return roles.map((role) => ({
      role,
      data:
        suggestions[role] ?? {
          title: "No suitable suggestions",
          suggestion: "No suitable suggestions",
        },
    }));
  }, [roles, suggestions]);

  const handlePublicToggle = (nextValue: boolean) => {
    if (!reflection) return;

    const nextIsPublic = nextValue;
    const nextIsAnonymous = nextIsPublic ? reflection.isAnonymous : true;

    handleVisibilityUpdate(nextIsPublic, nextIsAnonymous);
  };

  const handleIdentityChange = (nextIsAnonymous: boolean) => {
    handleVisibilityUpdate(true, nextIsAnonymous);
  };

  if (loading || !currentUser || isLoading) {
    return <p className="text-center text-slate-600">Loading reflection...</p>;
  }

  if (!reflection) {
    return <p className="text-center text-red-600">Reflection not found.</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{reflection.title || "Reflection"}</h1>
        <p className="text-sm text-slate-500">
          {reflection.createdAt
            ? new Date(reflection.createdAt).toLocaleString(undefined, {
                dateStyle: "full",
                timeStyle: "short",
              })
            : "Date unavailable"}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleEdit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Delete
        </button>
      </div>

      <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Make this reflection public</p>
            <p className="text-xs text-slate-600">
              Share this entry to the public feed. You can choose to stay anonymous.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={reflection.isPublic}
              onChange={(event) => handlePublicToggle(event.target.checked)}
              disabled={isUpdatingVisibility}
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300" />
          </label>
        </div>

        {reflection.isPublic && (
          <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">Identity</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="visibility-identity"
                  checked={reflection.isAnonymous}
                  onChange={() => handleIdentityChange(true)}
                  disabled={isUpdatingVisibility}
                  className="h-4 w-4"
                />
                Post anonymously
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="visibility-identity"
                  checked={!reflection.isAnonymous}
                  onChange={() => handleIdentityChange(false)}
                  disabled={isUpdatingVisibility}
                  className="h-4 w-4"
                />
                Show my identity
              </label>
            </div>
          </div>
        )}

        {visibilityError && <p className="text-sm text-red-600">{visibilityError}</p>}
        {isUpdatingVisibility && (
          <p className="text-xs text-slate-500">Updating visibility...</p>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Are you sure you want to delete this reflection? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Reflection Text</h3>
        <p className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-800">
          {reflection.text}
        </p>
      </div>

      {reflection.rolesInvolved && reflection.rolesInvolved.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">Roles Involved</h3>
          <div className="flex flex-wrap gap-2">
            {reflection.rolesInvolved.map((role) => (
              <span
                key={role}
                className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {orderedSuggestions.length > 0 && (
        <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">AI Suggestions</h3>
          <div className="space-y-2">
            {orderedSuggestions.map(({ role, data }) => {
              const isOpen = openRole === role;
              const isNoSuggestion = data.title === "No suitable suggestions";

              if (isNoSuggestion) {
                return (
                  <div
                    key={role}
                    className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm italic text-slate-500"
                  >
                    No suitable suggestions for: {role}
                  </div>
                );
              }

              return (
                <div
                  key={role}
                  className="rounded-md border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRole((prev) => (prev === role ? null : role))
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">
                        {role} — {data.title}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-slate-500">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200 px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {data.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default withAuth(ReflectionDetailsPage);
