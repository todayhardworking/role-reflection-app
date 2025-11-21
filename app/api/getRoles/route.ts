import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const userSnapshot = await userDocRef.get();

    if (!userSnapshot.exists) {
      await userDocRef.set({ roles: [] });
      return NextResponse.json({ roles: [] });
    }

    const data = userSnapshot.data();
    const roles = Array.isArray(data?.roles)
      ? (data.roles as unknown[])
          .map((role) => (typeof role === "string" ? role.trim() : ""))
          .filter((role) => role.length > 0)
      : [];

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
