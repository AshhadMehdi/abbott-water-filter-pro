-- Migration: 003_whatsapp_templates.sql
BEGIN;

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT UNIQUE NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed official templates
INSERT INTO whatsapp_templates (name, template_key, body, created_by)
VALUES
('Filter Expiry','filter_expiry','Dear {{name}}, your Abbott filter installed on {{install_date}} is due on {{due_date}}. Please book a service.', NULL)
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO whatsapp_templates (name, template_key, body, created_by)
VALUES
('Booking Confirmation','booking_confirmation','Hello {{name}}, your booking for {{scheduled_date}} at {{scheduled_time}} is confirmed. Technician: {{technician}}.', NULL)
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO whatsapp_templates (name, template_key, body, created_by)
VALUES
('Feedback Request','feedback_request','Hi {{name}}, thanks for your service today. Please rate us: {{feedback_link}}', NULL)
ON CONFLICT (template_key) DO NOTHING;

COMMIT;
