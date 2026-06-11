-- Apply: wrangler d1 execute kostech-web --file=server/database/migrations/0001_initial.sql

CREATE TABLE IF NOT EXISTS bookings (
  id              TEXT    PRIMARY KEY,
  service_slug    TEXT    NOT NULL,
  date            TEXT    NOT NULL,
  name            TEXT    NOT NULL,
  phone           TEXT    NOT NULL,
  email           TEXT    NOT NULL DEFAULT '',
  address         TEXT    NOT NULL DEFAULT '',
  notes           TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'new',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER,
  attachment_keys TEXT,   -- JSON: string[] of R2 object keys
  attachment_meta TEXT    -- JSON: Array<{name,type,size}>
);

CREATE TABLE IF NOT EXISTS leads (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL,
  email           TEXT    NOT NULL DEFAULT '',
  phone           TEXT    NOT NULL DEFAULT '',
  message         TEXT    NOT NULL DEFAULT '',
  description     TEXT    NOT NULL DEFAULT '',
  location        TEXT    NOT NULL DEFAULT '',
  scheduled_at    TEXT    NOT NULL DEFAULT '',
  source          TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'new',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER,
  attachment_keys TEXT,
  attachment_meta TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
