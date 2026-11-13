import { verify, json, bearerToken } from "../_lib/auth.js";

const KEY = "state";

// Anyone can read the league's data — this mirrors the public "Anyone with
// the link can view" behaviour the site had on claude.ai.
export async function onRequestGet({ env }) {
  const raw = await env.LEAGUE_KV.get(KEY);
  if (!raw) return json({ version: 0, json: null });
  try {
    const obj = JSON.parse(raw);
    return json({ version: obj.version || 0, json: obj.json });
  } catch (e) {
    return json({ version: 0, json: null });
  }
}

// Only the secretary (a valid token) can write.
export async function onRequestPost({ request, env }) {
  const token = bearerToken(request);
  const payload = await verify(token, env.AUTH_SECRET);
  if (!payload) return json({ error: "not_authorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_request" }, 400);
  }
  if (typeof body.json !== "string") return json({ error: "bad_request" }, 400);

  const raw = await env.LEAGUE_KV.get(KEY);
  const cur = raw ? JSON.parse(raw) : { version: 0, json: null };

  // Optimistic concurrency: if the client's view is stale, tell it so instead
  // of silently clobbering a newer save (e.g. two secretary tabs open).
  if (typeof body.version === "number" && body.version !== (cur.version || 0)) {
    return json({ error: "conflict", version: cur.version || 0, json: cur.json }, 409);
  }

  const newVersion = (cur.version || 0) + 1;
  await env.LEAGUE_KV.put(KEY, JSON.stringify({ version: newVersion, json: body.json }));
  return json({ version: newVersion });
}
