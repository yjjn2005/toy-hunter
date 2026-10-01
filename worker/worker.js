// toy-hunter-api: PIN 기반 동기화 (Cloudflare Worker + KV)
const MAX_BYTES = 100 * 1024;

function cors(req, env) {
  const allow = (env.ALLOW_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get("Origin") || "";
  const ok = allow.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : (allow[0] || ""),
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Pin",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

async function keyFor(pin, env) {
  const buf = new TextEncoder().encode("toy-hunter:" + (env.SALT || "") + ":" + pin);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return "p:" + [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(req, env) {
    const headers = { ...cors(req, env), "Content-Type": "application/json; charset=utf-8" };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const url = new URL(req.url);
    if (url.pathname === "/health") return json({ ok: true });
    if (url.pathname !== "/sync") return json({ error: "not_found" }, 404);

    const origin = req.headers.get("Origin") || "";
    const allow = (env.ALLOW_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (origin && !allow.includes(origin)) return json({ error: "forbidden_origin" }, 403);

    const pin = req.headers.get("X-Pin") || "";
    if (!/^\d{6,12}$/.test(pin)) return json({ error: "bad_pin" }, 400);
    const key = await keyFor(pin, env);

    if (req.method === "GET") {
      const v = await env.TOY_KV.get(key, "json");
      return json(v || { data: null, updatedAt: 0 });
    }
    if (req.method === "PUT") {
      const text = await req.text();
      if (text.length > MAX_BYTES) return json({ error: "too_large" }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: "bad_json" }, 400); }
      if (!body || typeof body.data !== "object" || body.data === null) return json({ error: "bad_body" }, 400);
      const rec = { data: body.data, updatedAt: Date.now() };
      await env.TOY_KV.put(key, JSON.stringify(rec));
      return json({ ok: true, updatedAt: rec.updatedAt });
    }
    return json({ error: "method_not_allowed" }, 405);
  },
};
