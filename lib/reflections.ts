export interface Reflection {
  id: string;
  text: string;
  createdAt: string;
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
  const response = await fetch(`/api/getReflections?uid=${encodeURIComponent(uid)}`);

  if (!response.ok) {
    throw new Error("Failed to load reflections");
  }

  const data = await response.json();
  return data.reflections as Reflection[];
}
