import { json } from "../_shared/auth.js";

// DB_1 ... DB_10 form one logical store. DB is supported as a legacy alias for DB_1.
function databases(env) {
  const first = env.DB_1 || env.DB;
  const numbered = [first, env.DB_2, env.DB_3, env.DB_4, env.DB_5, env.DB_6, env.DB_7, env.DB_8, env.DB_9, env.DB_10];
  const hasAdditionalBinding = !!env.DB_1 || [env.DB_2, env.DB_3, env.DB_4, env.DB_5, env.DB_6, env.DB_7, env.DB_8, env.DB_9, env.DB_10].some(Boolean);
  if (numbered.every(Boolean)) return numbered;
  if (!hasAdditionalBinding && env.DB) return [env.DB];
  return null;
}
function ready(env) { return !!databases(env); }
function parseRow(row) {
  try { const d = JSON.parse(row.data); return {...d, id:row.id, savedAt:row.saved_at || d.savedAt}; }
  catch { return null; }
}
function shardFor(id, count) {
  let hash = 2166136261;
  for (const ch of String(id)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % count;
}
async function findExistingShard(dbs, id) {
  for (const db of dbs) {
    const row = await db.prepare("SELECT id FROM documents WHERE id = ? LIMIT 1").bind(String(id)).first();
    if (row) return db;
  }
  return null;
}
async function save(env, doc) {
  const dbs = databases(env);
  if (!dbs) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 to the ten SLV databases, then redeploy."}, 503);
  if (!doc || typeof doc !== "object" || !doc.id || !doc.number || !doc.customer || !Array.isArray(doc.items)) {
    return json({error:"Document is missing required fields."}, 400);
  }
  const serialized = JSON.stringify(doc);
  if (serialized.length > 900000) return json({error:"Document is too large."}, 413);
  const savedAt = doc.savedAt || new Date().toISOString();
  const existingDb = await findExistingShard(dbs, doc.id);
  const target = existingDb || dbs[shardFor(doc.id, dbs.length)];
  await target.prepare("INSERT INTO documents (id, number, type, customer, doc_date, total, data, saved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number=excluded.number, type=excluded.type, customer=excluded.customer, doc_date=excluded.doc_date, total=excluded.total, data=excluded.data, saved_at=excluded.saved_at")
    .bind(String(doc.id), String(doc.number), String(doc.type || "quotation"), String(doc.customer), String(doc.date || ""), Number(doc.totals?.total || 0), serialized, savedAt).run();
  return json({ok:true, id:String(doc.id), savedAt});
}
export async function onRequestGet({env}) {
  const dbs = databases(env);
  if (!dbs) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 to the ten SLV databases, then redeploy."}, 503);
  try {
    const batches = await Promise.all(dbs.map(db => db.prepare("SELECT id, data, saved_at FROM documents ORDER BY saved_at DESC LIMIT 500").all()));
    const documents = batches.flatMap(result => (result.results || []).map(parseRow).filter(Boolean))
      .sort((a,b) => String(b.savedAt || "").localeCompare(String(a.savedAt || ""))).slice(0,500);
    return json({documents});
  } catch {
    return json({error:"Could not load saved documents. Check that schema.sql was run on every bound database."}, 500);
  }
}
export async function onRequestPost({request, env}) {
  if (!ready(env)) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 to the ten SLV databases, then redeploy."}, 503);
  try { return await save(env, await request.json()); } catch { return json({error:"Could not save document. Check that schema.sql was run on every bound database."}, 500); }
}
export async function onRequestPut({request, env}) {
  if (!ready(env)) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 to the ten SLV databases, then redeploy."}, 503);
  try { return await save(env, await request.json()); } catch { return json({error:"Could not update document. Check that schema.sql was run on every bound database."}, 500); }
}
export async function onRequestDelete({request, env}) {
  const dbs = databases(env);
  if (!dbs) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 to the ten SLV databases, then redeploy."}, 503);
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      await Promise.all(dbs.map(db => db.prepare("DELETE FROM documents WHERE id = ?").bind(id).run()));
    } else {
      await Promise.all(dbs.map(db => db.prepare("DELETE FROM documents").run()));
    }
    return json({ok:true});
  } catch {
    return json({error:"Could not delete documents. Check that schema.sql was run on every bound database."}, 500);
  }
}
