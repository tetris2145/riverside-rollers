import { verify, json, bearerToken } from "../_lib/auth.js";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB — matches the site's own video/photo limit

export async function onRequestPost({ request, env }) {
  const token = bearerToken(request);
  const payload = await verify(token, env.AUTH_SECRET);
  if (!payload) return json({ error: "not_authorized" }, 401);

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: "bad_request" }, 400);
  }
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return json({ error: "bad_request" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "too_large" }, 400);

  const id = crypto.randomUUID().replace(/-/g, "");
  await env.LEAGUE_R2.put(id, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return json({ id });
}
