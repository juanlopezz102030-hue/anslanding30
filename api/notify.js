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

  const token = process.env.WASENDER_API_TOKEN;
  const to = process.env.WASENDER_TO;

  if (!token) return res.status(500).json({ error: "Missing WASENDER_API_TOKEN" });
  if (!to) return res.status(500).json({ error: "Missing WASENDER_TO" });

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
