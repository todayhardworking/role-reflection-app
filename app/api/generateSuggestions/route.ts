import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { type RoleSuggestion } from "@/lib/reflections";

export const dynamic = "force-dynamic";

interface GenerateRequestBody {
  uid?: string;
  reflectionId?: string;
  reflectionText?: string;
  roles?: string[];
}

type SuggestionsResponse = Record<string, RoleSuggestion>;

function buildPrompt(reflectionText: string, roles: string[]): string {
  const rolesList = roles.map((role) => `- ${role}`).join("\n");
  return `You are an executive coach who provides clear, actionable guidance with a balanced tone (warm, supportive, and practical).

For each role listed, perform the following:
1. Create a short, concise title (3–6 words) summarizing the main advice.
2. Write a single coaching suggestion of 5–7 sentences.
3. The suggestion MUST explicitly reference details from the provided reflection and give specific next steps the user can take.
4. If a role is not applicable, return:
   { "title": "Not applicable", "suggestion": "Not applicable" }

Your response must be ONLY valid JSON with this structure:

{
  "RoleName": {
    "title": "Short title",
    "suggestion": "5–7 sentence coaching advice referencing the reflection."
  },
  "AnotherRole": {
    "title": "Short title",
    "suggestion": "Advice..."
  }
}

No commentary, no notes, no explanation outside JSON.

Reflection:
${reflectionText}

Roles:
${rolesList}`;
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

async function callChatModel(prompt: string): Promise<SuggestionsResponse> {
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
  return JSON.parse(jsonText) as SuggestionsResponse;
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
