export interface RoleSuggestion {
  title: string;
  suggestion: string;
}

export interface Reflection {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  rolesInvolved?: string[];
  suggestions?: Record<string, RoleSuggestion> | null;
  isPublic: boolean;
  isAnonymous: boolean;
  likes?: number;
  likedBy?: Record<string, boolean>;
}

export interface PublicReflection {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  rolesInvolved?: string[];
  isAnonymous: boolean;
  suggestions?: Record<string, RoleSuggestion> | null;
  likes?: number;
  likedBy?: Record<string, boolean>;
}

export interface LikedPublicReflection extends PublicReflection {
  likedAt: string;
}

export function deriveTitleFromText(text: string, providedTitle?: string) {
  const trimmedTitle = (providedTitle ?? "").trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

interface SaveReflectionResponse {
  success: boolean;
  id: string;
}

export async function saveReflection(
  text: string,
  uid: string,
  title?: string,
): Promise<SaveReflectionResponse> {
  const response = await fetch("/api/saveReflection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      text,
      title,
      isPublic: false,
      isAnonymous: true,
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
  title?: string,
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
      title,
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

export async function updateReflectionVisibility(
  reflectionId: string,
  isPublic: boolean,
  isAnonymous: boolean,
  idToken?: string,
): Promise<void> {
  const response = await fetch("/api/reflection/updateVisibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ id: reflectionId, isPublic, isAnonymous }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update visibility");
  }
}

export async function loadPublicReflections(): Promise<PublicReflection[]> {
  const response = await fetch("/api/publicReflections", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load public reflections");
  }

  const data = await response.json();
  return data.reflections as PublicReflection[];
}

export async function loadPublicReflection(reflectionId: string): Promise<PublicReflection> {
  const response = await fetch(
    `/api/publicReflection?${new URLSearchParams({ id: reflectionId }).toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to load public reflection");
  }

  const data = await response.json();
  return data.reflection as PublicReflection;
}

export async function loadUserLikedReflections(uid: string): Promise<LikedPublicReflection[]> {
  const response = await fetch(`/api/userLikes?uid=${encodeURIComponent(uid)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to load liked reflections");
  }

  const data = await response.json();
  return data.reflections as LikedPublicReflection[];
}
