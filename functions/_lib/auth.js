// Tiny signed-token helper used by the API routes. Not a general-purpose JWT
// library — just enough to issue and verify a "secretary is logged in" token
// without needing any extra dependency.

function b64url(bytesOrStr) {
  let bin;
  if (typeof bytesOrStr === "string") bin = bytesOrStr;
  else bin = String.fromCharCode(...new Uint8Array(bytesOrStr));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecodeToStr(s) {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}
function b64urlDecodeToBytes(s) {
  const str = b64urlDecodeToStr(s);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function sign(payload, secret) {
  const key = await hmacKey(secret);
  const data = JSON.stringify(payload);
  const head = b64url(data);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(head));
  const sig = b64url(sigBuf);
  return head + "." + sig;
}

export async function verify(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [head, sig] = token.split(".");
  if (!head || !sig) return null;
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecodeToBytes(sig),
      new TextEncoder().encode(head)
    );
    if (!ok) return null;
    const payload = JSON.parse(b64urlDecodeToStr(head));
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function bearerToken(request) {
  const h = request.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
