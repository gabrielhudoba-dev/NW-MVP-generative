/**
 * OpenAI client — proxied through /api/score route.
 * The API key stays server-side. Browser only calls our own API route.
 */

const SCORE_API_URL = "/api/score";
const TIMEOUT_MS = 15000;
const SCORING_VERSION = "1.0.0";
const MODEL = "gpt-5.4";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function openaiChat<T>(
  messages: OpenAIMessage[],
  options?: { temperature?: number }
): Promise<{ data: T; model: string; latency_ms: number } | null> {
  if (typeof window === "undefined") return null;

  const start = Date.now();

  try {
    const res = await fetch(SCORE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: 600,
      }),
      // Timeout handled by race pattern in select-hero.ts
    });

    if (!res.ok) {
      console.warn(`[ai] Score API returned ${res.status}`);
      return null;
    }

    const json = await res.json();

    if (json.error) {
      console.warn(`[ai] Score API error: ${json.error}`);
      return null;
    }

    return {
      data: json.data as T,
      model: json.model ?? MODEL,
      latency_ms: json.latency_ms ?? (Date.now() - start),
    };
  } catch (err) {
    console.warn("[ai] Score API request failed:", err);
    return null;
  }
}

export { MODEL as OPENAI_MODEL, SCORING_VERSION };
