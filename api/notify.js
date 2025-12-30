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

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const text = String(body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Missing text" });

  const token1 = process.env.WASENDER_API_TOKEN1 || process.env.WASENDER_API_TOKEN || "";
  const to1    = process.env.WASENDER_TO1       || process.env.WASENDER_TO       || "";
  const token2 = process.env.WASENDER_API_TOKEN2 || "";
  const to2    = process.env.WASENDER_TO2        || "";

  const has1 = !!(token1 && to1);
  const has2 = !!(token2 && to2);

  if (!has1 && !has2) {
    return res.status(500).json({
      error: "Missing env vars",
      details: "Need WASENDER_API_TOKEN1/WASENDER_TO1 and/or WASENDER_API_TOKEN2/WASENDER_TO2"
    });
  }

  // Podés forzar con body.line o query ?line=1|2
  const forcedLine = String((req.query?.line ?? body?.line ?? "")).trim();

  let chosen;
  if (forcedLine === "1" && has1) chosen = 1;
  else if (forcedLine === "2" && has2) chosen = 2;
  else {
    // Auto: si hay 2 líneas, random; si hay 1, usa la que exista
    if (has1 && has2) chos
