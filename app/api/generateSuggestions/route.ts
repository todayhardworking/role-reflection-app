import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { resolveCanRegenerate, type RoleSuggestion } from "@/lib/reflections";

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
  return `Reflection:\n${reflectionText}\n\nRoles:\n${rolesList}`;
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
            "You are an executive coach who provides clear, actionable guidance with a balanced tone (warm, supportive, and practical).\n\n    For each role listed, you MUST return exactly one JSON object with:\n    {\n      \"title\": \"...\",\n      \"suggestion\": \"...\"\n    }\n\n    Rules:\n    1. ALWAYS return a JSON entry for EVERY role in the input.\n    2. If the reflection is not relevant to a role, return:\n       { \"title\": \"No suitable suggestions\", \"suggestion\": \"No suitable suggestions\" }\n    3. For applicable roles:\n       - Create a short, concise title (3–6 words).\n       - Write a coaching suggestion of 5–7 sentences.\n       - The suggestion MUST reference specific details from the provided reflection.\n       - Include specific next steps the user can take.\n\n    Your response must be ONLY valid JSON structured like:\n\n    {\n      \"Role1\": { \"title\": \"...\", \"suggestion\": \"...\" },\n      \"Role2\": { \"title\": \"...\", \"suggestion\": \"...\" },\n      ...\n    }\n\n    No commentary or explanation outside JSON.",
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

    const existingSuggestions = reflectionData?.suggestions as
      | SuggestionsResponse
      | null
      | undefined;
    const canRegenerate = resolveCanRegenerate(
      reflectionData?.canRegenerate,
      existingSuggestions,
    );

    if (!canRegenerate) {
      return NextResponse.json(
        { error: "Cannot regenerate suggestions without editing the reflection." },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(reflectionText, roles);
    const aiSuggestions = await callChatModel(prompt);

    const suggestions = roles.reduce<SuggestionsResponse>((acc, role) => {
      const aiEntry = aiSuggestions[role];

      acc[role] = aiEntry ?? {
        title: "No suitable suggestions",
        suggestion: "No suitable suggestions",
      };

      return acc;
    }, {});

    const rolesInvolved = Object.entries(suggestions)
      .filter(([, value]) => value.title !== "No suitable suggestions")
      .map(([role]) => role);

    const updatedFields = {
      suggestions,
      rolesInvolved,
      canRegenerate: false,
      updatedAt: new Date().toISOString(),
    };

    await adminDb
      .collection("reflections")
      .doc(reflectionId)
      .set(updatedFields, { merge: true });

    return NextResponse.json({
      reflection: {
        id: reflectionId,
        ...updatedFields,
      },
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
