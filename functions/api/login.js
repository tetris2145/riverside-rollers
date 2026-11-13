import { sign, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_request" }, 400);
  }
  if (!body || typeof body.password !== "string") return json({ error: "bad_request" }, 400);
  if (!env.SECRETARY_PASSWORD) return json({ error: "server_not_configured" }, 500);
  if (body.password !== env.SECRETARY_PASSWORD) return json({ error: "invalid_password" }, 401);

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const token = await sign({ exp }, env.AUTH_SECRET);
  return json({ token, exp });
}
