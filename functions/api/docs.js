import { json } from "../_shared/auth.js";
function ready(env) { return !!env.DB; }
function parseRow(row) {
  try { const d = JSON.parse(row.data); return {...d, id:row.id, savedAt:row.saved_at || d.savedAt}; }
  catch { return null; }
}
async function save(env, doc) {
  if (!doc || typeof doc !== "object" || !doc.id || !doc.number || !doc.customer || !Array.isArray(doc.items)) {
    return json({error:"Document is missing required fields."}, 400);
  }
  const serialized = JSON.stringify(doc);
  if (serialized.length > 900000) return json({error:"Document is too large."}, 413);
  const savedAt = doc.savedAt || new Date().toISOString();
  await env.DB.prepare("INSERT INTO documents (id, number, type, customer, doc_date, total, data, saved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number=excluded.number, type=excluded.type, customer=excluded.customer, doc_date=excluded.doc_date, total=excluded.total, data=excluded.data, saved_at=excluded.saved_at")
    .bind(String(doc.id), String(doc.number), String(doc.type || "quotation"), String(doc.customer), String(doc.date || ""), Number(doc.totals?.total || 0), serialized, savedAt).run();
  return json({ok:true, id:String(doc.id), savedAt});
}
export async function onRequestGet({env}) {
  if (!ready(env)) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  const result = await env.DB.prepare("SELECT id, data, saved_at FROM documents ORDER BY saved_at DESC LIMIT 500").all();
  return json({documents:(result.results || []).map(parseRow).filter(Boolean)});
}
export async function onRequestPost({request, env}) {
  if (!ready(env)) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  try { return await save(env, await request.json()); } catch (e) { return json({error:"Could not save document."}, 500); }
}
export async function onRequestPut({request, env}) {
  if (!ready(env)) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  try { return await save(env, await request.json()); } catch (e) { return json({error:"Could not update document."}, 500); }
}
export async function onRequestDelete({request, env}) {
  if (!ready(env)) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."}, 503);
  const id = new URL(request.url).searchParams.get("id");
  if (id) await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
  else await env.DB.prepare("DELETE FROM documents").run();
  return json({ok:true});
}
