CREATE TABLE IF NOT EXISTS licenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT    NOT NULL UNIQUE,
  used        INTEGER NOT NULL DEFAULT 0,
  used_at     TEXT,  
  device_id   TEXT,                         
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_license_key ON licenses(license_key);