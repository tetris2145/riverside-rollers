import { verify, json, bearerToken } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const token = bearerToken(request);
  const payload = await verify(token, env.AUTH_SECRET);
  if (!payload) return json({ error: "not_authorized" }, 401);
  return json({ ok: true });
}
