export interface RoleSuggestion {
  title: string;
  suggestion: string;
}

export interface Reflection {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  suggestions?: Record<string, RoleSuggestion> | null;
}

interface SaveReflectionResponse {
  success: boolean;
  id: string;
}

export async function saveReflection(text: string, uid: string): Promise<SaveReflectionResponse> {
  const response = await fetch("/api/saveReflection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      text,
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save reflection");
  }

  return response.json();
}

export async function loadReflections(uid: string): Promise<Reflection[]> {
  const response = await fetch(`/api/getReflections?uid=${uid}`);

  if (!response.ok) {
    throw new Error("Failed to load reflections");
  }

  const data = await response.json();
  return data.reflections as Reflection[];
}

export async function loadReflection(reflectionId: string, uid?: string): Promise<Reflection> {
  const searchParams = new URLSearchParams({ reflectionId });
  if (uid) {
    searchParams.set("uid", uid);
  }

  const response = await fetch(`/api/getReflection?${searchParams.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to load reflection");
  }

  const data = await response.json();
  return data.reflection as Reflection;
}

export async function updateReflection(
  reflectionId: string,
  uid: string,
  text: string,
): Promise<void> {
  const response = await fetch("/api/updateReflection", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      reflectionId,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update reflection");
  }
}

export async function deleteReflection(reflectionId: string, uid: string): Promise<void> {
  const response = await fetch("/api/deleteReflection", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      reflectionId,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to delete reflection");
  }
}
