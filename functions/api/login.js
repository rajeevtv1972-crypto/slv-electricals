import { createSession, clearSession, json } from "../_shared/auth.js";
export async function onRequestPost({request, env}) {
  if (!env.SLV_LOGIN_USERNAME || !env.SLV_LOGIN_PASSWORD || !env.SESSION_SECRET) {
    return json({error:"Login service is not configured. Set SLV_LOGIN_USERNAME, SLV_LOGIN_PASSWORD, and SESSION_SECRET in Cloudflare Pages environment variables."}, 503);
  }
  let body;
  try { body = await request.json(); } catch { return json({error:"Invalid request."}, 400); }
  const username = String(body.username || "");
  const password = String(body.password || "");
  if (username !== env.SLV_LOGIN_USERNAME || password !== env.SLV_LOGIN_PASSWORD) {
    return json({error:"Invalid username or password."}, 401);
  }
  return json({ok:true}, 200, { "Set-Cookie": await createSession(env) });
}
export async function onRequestDelete() {
  return json({ok:true}, 200, {"Set-Cookie":clearSession()});
}
