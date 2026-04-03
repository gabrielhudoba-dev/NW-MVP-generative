import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

/**
 * POST /api/score
 *
 * Proxies the OpenAI scoring request server-side.
 * Keeps the API key out of the browser bundle.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { messages, temperature = 0.3, max_tokens = 600 } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const start = Date.now();

    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[api/score] OpenAI returned ${res.status}: ${text}`);
      return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    return NextResponse.json({
      data: JSON.parse(content),
      model: json.model ?? MODEL,
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    console.warn("[api/score] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
