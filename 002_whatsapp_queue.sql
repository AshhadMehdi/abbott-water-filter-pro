-- Migration: 002_whatsapp_queue.sql
BEGIN;

DO $$ BEGIN
    CREATE TYPE whatsapp_status_enum AS ENUM ('pending','sent','failed');
EXCEPTION WHEN duplicate_object THEN null; END$$;

CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_used TEXT,
  status whatsapp_status_enum DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  queued_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_queue(status);

COMMIT;
