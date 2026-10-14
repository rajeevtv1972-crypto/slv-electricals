import { json } from "../_shared/auth.js";

function databases(env) {
  const first = env.DB_1 || env.DB;
  const numbered = [first, env.DB_2, env.DB_3, env.DB_4, env.DB_5, env.DB_6, env.DB_7, env.DB_8, env.DB_9, env.DB_10];
  const anyNumbered = numbered.some(Boolean) || !!env.DB_1;
  if (numbered.every(Boolean)) return numbered;
  if (!anyNumbered && env.DB) return [env.DB];
  return null;
}
export async function onRequestPost({request,env}) {
  const dbs = databases(env);
  if (!dbs) return json({error:"D1 storage is not fully configured. Bind DB_1 through DB_10 and redeploy."},503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Invalid request."},400); }
  const type = body.type === "invoice" ? "invoice" : body.type === "quotation" ? "quotation" : null;
  if (!type) return json({error:"Document type must be quotation or invoice."},400);
  const prefix = type === "quotation" ? "SLV-Q-" : "SLV-B-";
  try {
    const maxima = await Promise.all(dbs.map(db => db.prepare(
      "SELECT MAX(CAST(SUBSTR(number, 7) AS INTEGER)) AS max_value FROM documents WHERE type = ? AND number LIKE ?"
    ).bind(type, prefix + "%").first()));
    const maxExisting = Math.max(0, ...maxima.map(row => Number(row?.max_value || 0)));
    // DB_1 is the central sequence store. The UPSERT increments atomically, even if
    // two devices request numbers at nearly the same time.
    const central = dbs[0];
    const row = await central.prepare(
      "INSERT INTO document_sequences (type, value) VALUES (?, ?) ON CONFLICT(type) DO UPDATE SET value = MAX(document_sequences.value, excluded.value) + 1 RETURNING value"
    ).bind(type, maxExisting + 1).first();
    if (!row) return json({error:"Could not reserve a document number."},500);
    return json({number:prefix+String(row.value).padStart(4,"0")});
  } catch {
    return json({error:"Could not reserve a document number. Check that schema.sql was run on every bound database."},500);
  }
}
