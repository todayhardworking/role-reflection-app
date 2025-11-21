import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { uid, role } = await request.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const trimmedRole = typeof role === "string" ? role.trim() : "";

    if (!trimmedRole) {
      return NextResponse.json({ error: "Role cannot be empty" }, { status: 400 });
    }

    const userDocRef = adminDb.collection("users").doc(uid);

    const updatedRoles = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userDocRef);

      const existingRoles = Array.isArray(snapshot.data()?.roles)
        ? (snapshot.data()?.roles as unknown[])
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0)
        : [];

      const normalizedRole = trimmedRole.toLowerCase();
      const hasRole = existingRoles.some((existingRole) => existingRole.toLowerCase() === normalizedRole);

      if (hasRole) {
        if (!snapshot.exists) {
          transaction.set(userDocRef, { roles: existingRoles });
        }

        return existingRoles;
      }

      const newRoles = [...existingRoles, trimmedRole];

      if (snapshot.exists) {
        transaction.update(userDocRef, { roles: newRoles });
      } else {
        transaction.set(userDocRef, { roles: newRoles });
      }

      return newRoles;
    });

    return NextResponse.json({ roles: updatedRoles });
  } catch (error) {
    console.error("Error adding role:", error);
    return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
  }
}
