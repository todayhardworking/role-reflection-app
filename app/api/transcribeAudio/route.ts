import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY environment variable is not set" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded audio file is empty" }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, file.name || "recording.webm");
    upstreamFormData.append("model", model);
    upstreamFormData.append(
      "prompt",
      "Transcribe a user's personal reflection voice note accurately with punctuation.",
    );
    upstreamFormData.append("response_format", "json");

    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamFormData,
    });

    const payload = (await response.json()) as {
      text?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      const message = payload.error?.message || "OpenAI transcription request failed";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json({ text: payload.text || "" });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
