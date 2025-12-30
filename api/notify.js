/**
 * Vercel Serverless Function
 * Route: https://TU-DOMINIO.vercel.app/api/notify
 *
 * Env vars (Vercel → Project → Settings → Environment Variables):
 *  - WASENDER_API_TOKEN = (tu token)
 *  - WASENDER_TO        = +59896689636  (tu número destino)
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Soporta 1, 2 o 3 sesiones (tokens/números) para rotación
// Preferidos: WASENDER_API_TOKEN1 / WASENDER_TO1, WASENDER_API_TOKEN2 / WASENDER_TO2, y WASENDER_API_TOKEN3 / WASENDER_TO3
// Fallback:   WASENDER_API_TOKEN / WASENDER_TO
const pool = [
  { token: process.env.WASENDER_API_TOKEN1, to: process.env.WASENDER_TO1 },
  { token: process.env.WASENDER_API_TOKEN2, to: process.env.WASENDER_TO2 },
  { token: process.env.WASENDER_API_TOKEN3, to: process.env.WASENDER_TO3 },
].filter(x => x.token && x.to);

const fallbackToken = process.env.WASENDER_API_TOKEN;
const fallbackTo = process.env.WASENDER_TO;

const effectivePool = pool.length ? pool : (fallbackToken && fallbackTo ? [{ token: fallbackToken, to: fallbackTo }] : []);

if (!effectivePool.length) {
  return res.status(500).json({ error: "Missing WASENDER env vars (token/to)" });
}

// Rotación por hora (misma idea que tu landing)
const idx = Math.floor(Date.now() / (60 * 60 * 1000)) % effectivePool.length;
const { token, to } = effectivePool[idx];

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const text = String(body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Missing text" });

  // Node18+ (Vercel) tiene fetch global; fallback por si el runtime cambia
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
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Upstream request failed" });
  }
};
