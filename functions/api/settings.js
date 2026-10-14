import { json } from "../_shared/auth.js";
function centralDb(env) {
  // DB_1 is the central settings/sequence database. Keep DB as a legacy alias.
  return env.DB_1 || env.DB || null;
}
export async function onRequestGet({env}) {
  const db = centralDb(env);
  if (!db) return json({error:"Cloud database is not connected. Bind DB_1 to the first SLV database."},503);
  try {
    const row = await db.prepare("SELECT data FROM app_settings WHERE id = 'business'").first();
    if (!row) return json({business:null});
    try { return json({business:JSON.parse(row.data)}); } catch { return json({business:null}); }
  } catch { return json({error:"Could not load business settings. Run schema.sql on the first database."},500); }
}
export async function onRequestPut({request,env}) {
  const db = centralDb(env);
  if (!db) return json({error:"Cloud database is not connected. Bind DB_1 to the first SLV database."},503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Invalid request."},400); }
  if (!body.business || typeof body.business !== "object") return json({error:"Business details are required."},400);
  const data = JSON.stringify(body.business);
  if (data.length > 50000) return json({error:"Business details are too large."},413);
  try {
    await db.prepare("INSERT INTO app_settings (id, data, updated_at) VALUES ('business', ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
      .bind(data, new Date().toISOString()).run();
    return json({ok:true});
  } catch { return json({error:"Could not save business settings. Run schema.sql on the first database."},500); }
}
