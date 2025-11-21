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
