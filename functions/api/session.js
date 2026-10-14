import { getSession, json } from "../_shared/auth.js";
export async function onRequest({request, env}) {
  return json({authenticated:!!(await getSession(request, env))});
}
