import { json } from "../_shared/auth.js";
export async function onRequestPost({request,env}) {
  if (!env.DB) return json({error:"Cloud database is not connected. Follow the D1 setup in README.md."},503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Invalid request."},400); }
  const type = body.type === "invoice" ? "invoice" : body.type === "quotation" ? "quotation" : null;
  if (!type) return json({error:"Document type must be quotation or invoice."},400);
  const prefix = type === "quotation" ? "SLV-Q-" : "SLV-B-";
  const row = await env.DB.prepare(
    "INSERT INTO document_sequences (type, value) VALUES (?, COALESCE((SELECT MAX(CAST(SUBSTR(number, 7) AS INTEGER)) FROM documents WHERE type = ?), 0) + 1) ON CONFLICT(type) DO UPDATE SET value = MAX(document_sequences.value, COALESCE((SELECT MAX(CAST(SUBSTR(number, 7) AS INTEGER)) FROM documents WHERE type = ?), 0)) + 1 RETURNING value"
  ).bind(type,type,type).first();
  if (!row) return json({error:"Could not reserve a document number."},500);
  return json({number:prefix+String(row.value).padStart(4,"0")});
}
