export interface RolesResponse {
  roles: string[];
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || "Failed to process roles request";
    throw new Error(message);
  }

  return (await response.json()) as RolesResponse;
}

export async function loadRoles(uid: string): Promise<string[]> {
  const response = await fetch(`/api/getRoles?uid=${encodeURIComponent(uid)}`);
  const data = await handleResponse(response);
  return data.roles;
}

export async function addRole(uid: string, role: string): Promise<string[]> {
  const response = await fetch("/api/addRole", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid, role }),
  });

  const data = await handleResponse(response);
  return data.roles;
}

export async function removeRole(uid: string, role: string): Promise<string[]> {
  const response = await fetch("/api/removeRole", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid, role }),
  });

  const data = await handleResponse(response);
  return data.roles;
}
