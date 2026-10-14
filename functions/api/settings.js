import { json } from "../_shared/auth.js";
export async function onRequestGet({env}) {
  if (!env.DB) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  const row = await env.DB.prepare("SELECT data FROM app_settings WHERE id = 'business'").first();
  if (!row) return json({business:null});
  try { return json({business:JSON.parse(row.data)}); } catch { return json({business:null}); }
}
export async function onRequestPut({request,env}) {
  if (!env.DB) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Invalid request."}, 400); }
  if (!body.business || typeof body.business !== "object") return json({error:"Business details are required."}, 400);
  const data = JSON.stringify(body.business);
  if (data.length > 50000) return json({error:"Business details are too large."}, 413);
  await env.DB.prepare("INSERT INTO app_settings (id, data, updated_at) VALUES ('business', ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
    .bind(data, new Date().toISOString()).run();
  return json({ok:true});
}
