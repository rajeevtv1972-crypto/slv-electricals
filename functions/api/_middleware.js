import { getSession, json } from "../_shared/auth.js";
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (path === "/api/login" || path === "/api/session") return context.next();
  const session = await getSession(context.request, context.env);
  if (!session) return json({error:"Please sign in to access SLV Electricals records."}, 401);
  return context.next();
}
