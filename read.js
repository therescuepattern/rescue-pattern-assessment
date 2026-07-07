// api/read.js  —  Vercel serverless function
// Holds your Anthropic API key server-side and returns the personalized result read.
// The browser NEVER sees your key. Front-end POSTs the scores; this builds the
// prompt, calls Claude, and returns plain text.
//
// SET THIS ENV VAR IN VERCEL  →  Settings ▸ Environment Variables
//   ANTHROPIC_API_KEY = sk-ant-...   (from console.anthropic.com/settings/keys)

const MODEL = "claude-sonnet-4-6";

// Vercel Pro allows longer function runs — give the AI call room so a slow
// response never gets cut off (Hobby caps at 10s; Pro default 60s, up to 300s).
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS (safe defaults; tighten "*" to your domain once live)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "Server not configured: missing ANTHROPIC_API_KEY" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const scores = Array.isArray(body.scores) ? body.scores : [];
    const dominant = Array.isArray(body.dominant) ? body.dominant : [];

    if (!scores.length) return res.status(400).json({ error: "Missing scores" });

    const scoreLine = scores.map((s) => `${s.name}: ${s.score}/20`).join(", ");
    const dominantLine = dominant.join(" + ") || "mixed";

    const prompt = `A person just finished a self-assessment about the "rescue pattern" — the tendency to organize identity around saving, fixing, and over-giving in relationships. Their dimension scores (0-20 each): ${scoreLine}. Their dominant blend: ${dominantLine}.

Write a brief, warm, direct read of THIS specific person's pattern. Requirements:
- Second person ("you"), 150-180 words.
- Voice: a wise, no-bullshit older sibling. Honest, never clinical, never diagnostic. No disorder language.
- Speak to what their specific dominant blend does in real relationships, and give one honest reframe that points forward.
- Do NOT restate the scores. Do NOT use lists, headers, or bullet points. Just plain paragraphs.
- Don't be saccharine. Earn the hope.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ error: "Upstream error", detail: detail.slice(0, 300) });
    }

    const data = await r.json();
    const text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    if (!text) return res.status(502).json({ error: "Empty response" });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error", detail: String(e).slice(0, 200) });
  }
}
