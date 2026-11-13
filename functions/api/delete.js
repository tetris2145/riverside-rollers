import { verify, json, bearerToken } from "../_lib/auth.js";

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
  if (!body || !body.id || typeof body.id !== "string") return json({ error: "bad_request" }, 400);

  await env.LEAGUE_R2.delete(body.id);
  return json({ ok: true });
}
