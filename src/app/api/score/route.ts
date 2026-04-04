import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/score
 *
 * Proxies the AI scoring request server-side.
 * Keeps the API key out of the browser bundle.
 *
 * Accepts: { messages: [{role, content}], temperature?, max_tokens? }
 * Returns: { data: <parsed JSON>, model: string, latency_ms: number }
 */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { messages, temperature = 0.3, max_tokens = 600 } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const start = Date.now();

    const res = await client.responses.create({
      model: MODEL,
      input: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      temperature,
      max_output_tokens: max_tokens,
      text: { format: { type: "json_object" } },
    });

    const content = res.output_text;

    if (!content) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    return NextResponse.json({
      data: JSON.parse(content),
      model: res.model ?? MODEL,
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn("[api/score] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
