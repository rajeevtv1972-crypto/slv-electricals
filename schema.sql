-- Run this file against the SLV Electricals D1 database.
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  type TEXT NOT NULL,
  customer TEXT NOT NULL,
  doc_date TEXT NOT NULL DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_saved_at ON documents(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer);
CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(number);
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_sequences (
  type TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
