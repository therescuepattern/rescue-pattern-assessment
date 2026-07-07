// api/subscribe.js  —  Vercel serverless function
// Captures emails from the assessment and adds them to your list so you build an
// audience even from people who don't buy. Provider-agnostic; wired for Kit
// (ConvertKit) out of the box because it's the creator standard. Swap the block
// marked PROVIDER for Mailchimp / Beehiiv / Airtable if you prefer.
//
// SET THESE ENV VARS IN VERCEL:
//   KIT_API_KEY  = your Kit (ConvertKit) API key
//   KIT_FORM_ID  = the form ID emails should land in
//
// No list yet? This still returns 200 and just no-ops, so the app never breaks.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const email = String(body.email || "").trim().toLowerCase();
    const honeypot = String(body.company || ""); // bots fill hidden fields

    if (honeypot) return res.status(200).json({ ok: true }); // silently drop bots
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) return res.status(400).json({ error: "Enter a valid email" });

    // Optional: pass which result type they got, for segmentation
    const tag = String(body.type || "").slice(0, 60);

    // ---- PROVIDER: Kit (ConvertKit) ----
    const KEY = process.env.KIT_API_KEY;
    const FORM = process.env.KIT_FORM_ID;
    if (!KEY || !FORM) {
      // Not configured yet — accept gracefully so the UX still works.
      return res.status(200).json({ ok: true, stored: false });
    }

    const r = await fetch(`https://api.convertkit.com/v3/forms/${FORM}/subscribe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: KEY, email, fields: { result_type: tag } }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ error: "List provider error", detail: detail.slice(0, 200) });
    }
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error", detail: String(e).slice(0, 200) });
  }
}
