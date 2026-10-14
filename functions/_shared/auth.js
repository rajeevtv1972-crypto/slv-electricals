const COOKIE = "slv_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const enc = new TextEncoder();
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function unb64url(s) {
  const normal = s.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normal + "=".repeat((4 - normal.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function sign(payload, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload))));
}
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return n === 0;
}
export async function createSession(env) {
  const payload = b64url(enc.encode(JSON.stringify({sub:"slv-shared", exp:Date.now() + MAX_AGE * 1000})));
  const signature = await sign(payload, env.SESSION_SECRET);
  return COOKIE + "=" + payload + "." + signature + "; Path=/; Max-Age=" + MAX_AGE + "; HttpOnly; Secure; SameSite=Strict";
}
export function clearSession() {
  return COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}
export async function getSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="));
  if (!match) return null;
  const token = match.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot), signature = token.slice(dot + 1);
  const expected = await sign(payload, env.SESSION_SECRET);
  if (!safeEqual(signature, expected)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (data.sub !== "slv-shared" || !Number.isFinite(data.exp) || data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}
export function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}});
}
