import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

interface GenerateRequestBody {
  uid?: string;
  reflectionId?: string;
  reflectionText?: string;
  roles?: string[];
}

function buildPrompt(reflectionText: string, roles: string[]): string {
  const rolesList = roles.map((role) => `- ${role}`).join("\n");
  return `You are an executive coach who provides concise, actionable guidance. For each role listed, write a single coaching suggestion of 5-7 sentences tailored to the provided reflection. If a role is not applicable, respond with "Not applicable" for that role. Respond ONLY with valid JSON where each key is the role name and each value is the suggestion string. Do not include any additional commentary or formatting.\n\nReflection:\n${reflectionText}\n\nRoles:\n${rolesList}`;
}

function cleanJson(content: string | null | undefined): string {
  if (!content) return "";
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    const stripped = trimmed.replace(/^```[a-zA-Z]*\n?/, "");
    const closingIndex = stripped.lastIndexOf("```");
    return closingIndex !== -1 ? stripped.slice(0, closingIndex).trim() : stripped.trim();
  }
  return trimmed;
}

async function callChatModel(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a focused coaching assistant. Return only JSON objects without additional formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chat API request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  const jsonText = cleanJson(content);
  return JSON.parse(jsonText) as Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const { uid, reflectionId, reflectionText, roles }: GenerateRequestBody =
      await request.json();

    if (!uid || !reflectionId || !reflectionText || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reflectionDoc = await adminDb.collection("reflections").doc(reflectionId).get();

    if (!reflectionDoc.exists) {
      return NextResponse.json(
        { error: "Reflection not found" },
        { status: 404 }
      );
    }

    const reflectionData = reflectionDoc.data();

    if (reflectionData?.uid && reflectionData.uid !== uid) {
      return NextResponse.json(
        { error: "Unauthorized to update this reflection" },
        { status: 403 }
      );
    }

    const prompt = buildPrompt(reflectionText, roles);
    const suggestions = await callChatModel(prompt);

    await adminDb
      .collection("reflections")
      .doc(reflectionId)
      .set({ suggestions }, { merge: true });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
