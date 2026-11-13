// Serves uploaded photos/videos straight out of R2, publicly and cached hard
// (ids are random and content-addressed in practice — a photo never changes
// under the same id, it gets a new one).
export async function onRequestGet({ params, env }) {
  const obj = await env.LEAGUE_R2.get(params.id);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
