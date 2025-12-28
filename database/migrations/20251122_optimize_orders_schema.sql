-- 1. Composite Index for High-Performance Order Filtering
-- Optimizes queries filtering by restaurant_id, sorting by created_at DESC, and optionally filtering by status.
CREATE INDEX IF NOT EXISTS orders_restaurant_createdat_desc_status_idx
ON orders (restaurant_id, created_at DESC, status);

-- 2. Audit Log Table
-- Stores a history of changes for audited tables.
CREATE TABLE IF NOT EXISTS audit_log (
  id            bigserial primary key,
  event_time    timestamptz not null default now(),
  table_schema  text not null,
  table_name    text not null,
  record_id     text,
  operation     text not null,
  actor_id      uuid, -- Capture the user who made the change
  record        jsonb, -- New state
  old_record    jsonb  -- Previous state
);

-- Indexes for Audit Log
CREATE INDEX IF NOT EXISTS audit_log_table_record_idx ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_log_event_time_idx ON audit_log (event_time DESC);

-- RLS for Audit Log (Admins only)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 3. Audit Trigger Function
-- Generic function to log INSERT/UPDATE/DELETE events.
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id text;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := OLD.id::text;
  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id::text;
  ELSIF (TG_OP = 'INSERT') THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id::text;
  END IF;

  INSERT INTO audit_log (
    table_schema,
    table_name,
    record_id,
    operation,
    actor_id,
    record,
    old_record
  ) VALUES (
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    auth.uid(),
    v_new_data,
    v_old_data
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Audit Trigger to order_comments
DROP TRIGGER IF EXISTS audit_order_comments ON order_comments;
CREATE TRIGGER audit_order_comments
AFTER INSERT OR UPDATE OR DELETE ON order_comments
FOR EACH ROW EXECUTE FUNCTION log_audit_event();
