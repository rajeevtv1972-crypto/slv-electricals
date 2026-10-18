import { getSession, json } from "../_shared/auth.js";
export async function onRequest({request, env}) {
  const session = await getSession(request, env);
  return json({authenticated:!!session, expiresAt:session?.exp || null});
}
