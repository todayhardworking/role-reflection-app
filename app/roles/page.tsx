"use client";

export const authRequired = true;

import { useUser } from "@/context/UserContext";
import { addRole, loadRoles, removeRole } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RolesPage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [removingRole, setRemovingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/signin");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        setError(null);
        const fetchedRoles = await loadRoles(currentUser.uid);
        setRoles(fetchedRoles);
      } catch (err) {
        console.error("Failed to load roles", err);
        setError("Failed to load roles. Please try again.");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [currentUser]);

  const handleAddRole = async () => {
    if (!currentUser) return;

    const trimmedRole = newRole.trim();

    if (!trimmedRole) {
      setError("Please enter a role before adding.");
      return;
    }

    const isDuplicate = roles.some((role) => role.toLowerCase() === trimmedRole.toLowerCase());

    if (isDuplicate) {
      setError("That role is already in your list.");
      return;
    }

    try {
      setSavingRole(true);
      setError(null);
      const updatedRoles = await addRole(currentUser.uid, trimmedRole);
      setRoles(updatedRoles);
      setNewRole("");
    } catch (err) {
      console.error("Failed to add role", err);
      setError("Failed to add role. Please try again.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!currentUser) return;

    try {
      setRemovingRole(role);
      setError(null);
      const updatedRoles = await removeRole(currentUser.uid, role);
      setRoles(updatedRoles);
    } catch (err) {
      console.error("Failed to remove role", err);
      setError("Failed to remove role. Please try again.");
    } finally {
      setRemovingRole(null);
    }
  };

  if (loading || !currentUser) {
    return <p className="text-center text-slate-600">Loading your roles...</p>;
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-sm text-slate-500">Personalize your experience</p>
        <h2 className="text-2xl font-semibold text-slate-900">Manage your roles</h2>
        <p className="text-sm text-slate-600">
          Roles help the AI tailor future suggestions to what matters most to you. Add the different hats you wear to
          keep guidance relevant.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Your roles</h3>
          {loadingRoles && <span className="text-sm text-slate-500">Loading...</span>}
        </div>
        {roles.length === 0 && !loadingRoles ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
            Add roles such as Teacher, Businessman, Online Coach, YouTuber, Father, Investor… Roles help the AI give
            better suggestions.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {roles.map((role) => (
              <li key={role} className="flex items-center justify-between gap-3 p-4">
                <span className="text-slate-800">{role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  disabled={removingRole === role}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingRole === role ? "Removing..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-slate-700">
          Add a new role
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="role"
            name="role"
            type="text"
            value={newRole}
            onChange={(event) => {
              setNewRole(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="e.g., Product Manager"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={handleAddRole}
            disabled={savingRole}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {savingRole ? "Adding..." : "Add Role"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
