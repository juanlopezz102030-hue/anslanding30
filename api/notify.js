/**
 * Vercel Serverless Function
 * Route: /api/notify
 *
 * Env vars:
 *  - WASENDER_API_TOKEN1
 *  - WASENDER_TO1
 *  - WASENDER_API_TOKEN2
 *  - WASENDER_TO2
 *
 * (Compat) también soporta:
 *  - WASENDER_API_TOKEN
 *  - WASENDER_TO
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Acepta JSON aunque venga como string
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const text = String(body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Missing text" });

  // Lee envs (con fallback a las viejas)
  const token1 = process.env.WASENDER_API_TOKEN1 || process.env.WASENDER_API_TOKEN || "";
  const to1    = process.env.WASENDER_TO1       || process.env.WASENDER_TO       || "";
  const token2 = process.env.WASENDER_API_TOKEN2 || "";
  const to2    = process.env.WASENDER_TO2        || "";

  // Permite forzar línea por body.line o query ?line=1|2
  const forcedLine =
    (req.query && (req.query.line || req.query.LINE)) ||
    body?.line ||
    body?.LINE;

  let chosen = null;

  const has1 = !!(token1 && to1);
  const has2 = !!(token2 && to2);

  if (!has1 && !has2) {
    return res.status(500).json({
      error: "Missing env vars",
      details: "Need WASENDER_API_TOKEN1/WASENDER_TO1 and/or WASENDER_API_TOKEN2/WASENDER_TO2"
    });
  }

  if (String(forcedLine) === "1" && has1) chosen = 1;
  else if (String(forcedLine) === "2" && has2) chosen = 2;
  else {
    // Auto: si hay 2 líneas, elige random; si hay 1, usa la que exista
    if (has1 && has2) chosen = (Math.random() < 0.5 ? 1 : 2);
    else chosen = has1 ? 1 : 2;
  }

  const token = (chosen === 1 ? token1 : token2);
  const to    = (chosen === 1 ? to1    : to2);

  const fetchFn = globalThis.fetch || (await import("node-fetch")).default;

  try {
    const r = await fetchFn("https://wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, text }),
    });

    const data = await r.json().catch(() => ({}));
    // Devuelve qué línea se usó (sin exponer tokens)
    return res.status(r.status).json({ line_used: chosen, ...data });
  } catch (e) {
    return res.status(500).json({ error: "Upstream request failed" });
  }
};
