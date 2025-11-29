import { type RoleSuggestion } from "./reflections";

export type Suggestions = Record<string, RoleSuggestion>;

export interface SuggestionsResult {
  suggestions: Suggestions;
  rolesInvolved: string[];
  canRegenerate: boolean;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error || "Failed to process suggestions request";
    throw new Error(message);
  }

  return response.json();
}

export async function generateSuggestions(
  reflectionId: string,
  uid: string,
  text: string,
  roles: string[]
): Promise<SuggestionsResult> {
  const response = await fetch("/api/generateSuggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reflectionId, uid, reflectionText: text, roles }),
  });

  const data = await handleResponse(response);
  return data.reflection as SuggestionsResult;
}

export async function loadSuggestions(reflectionId: string): Promise<Suggestions | null> {
  const response = await fetch(
    `/api/getReflection?reflectionId=${encodeURIComponent(reflectionId)}`
  );

  const data = await handleResponse(response);
  return (data.reflection?.suggestions as Suggestions | null) ?? null;
}
