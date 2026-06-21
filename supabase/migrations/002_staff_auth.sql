-- ============================================================
-- Sindat (ຊິ້ນດາດ) BBQ — Staff Accounts & Role-Based Access
-- Migration 002
-- ============================================================

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT NOT NULL UNIQUE,             -- canonical format, e.g. '0205512345'
  auth_user_id  UUID NOT NULL UNIQUE,              -- FK to auth.users.id (Supabase managed)
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('kitchen', 'cashier', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_staff_auth_user_id ON staff(auth_user_id);
CREATE INDEX idx_staff_phone ON staff(phone);
CREATE INDEX idx_staff_role ON staff(role);

-- ============================================================
-- HELPER FUNCTION — get the calling user's staff role
-- Used inside RLS policies to check role without recursion issues
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_staff_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM staff WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_active_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE auth_user_id = auth.uid() AND is_active = true
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Any authenticated active staff member can read the staff list
-- (needed so the app can look up names/roles for display)
CREATE POLICY "Active staff can read staff table"
  ON staff FOR SELECT
  USING (is_active_staff());

-- Only admins can insert new staff accounts
CREATE POLICY "Admins can create staff"
  ON staff FOR INSERT
  WITH CHECK (get_my_staff_role() = 'admin');

-- Only admins can update staff accounts (role changes, deactivation)
CREATE POLICY "Admins can update staff"
  ON staff FOR UPDATE
  USING (get_my_staff_role() = 'admin');

-- Only admins can delete staff accounts
CREATE POLICY "Admins can delete staff"
  ON staff FOR DELETE
  USING (get_my_staff_role() = 'admin');

-- ============================================================
-- TIGHTEN EXISTING POLICIES — now that staff accounts exist,
-- restrict order/table mutations that should be staff-only
-- ============================================================

-- Replace the old fully-public order status update policy
DROP POLICY IF EXISTS "Public update orders" ON orders;

-- Customers can still create orders (no auth required — QR code flow)
-- but only kitchen/cashier/admin staff can change order status
CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    get_my_staff_role() IN ('kitchen', 'cashier', 'admin')
  );

-- Replace the old fully-public table update policy
DROP POLICY IF EXISTS "Public update tables" ON tables;

-- Table status changes (close table, transfer/merge) restricted to cashier/admin
-- NOTE: the customer-facing app still needs to set current_session_id when a
-- NEW session starts — that specific case is handled via a SECURITY DEFINER
-- function below rather than a broad public policy, to avoid reopening this hole.
CREATE POLICY "Staff can update tables"
  ON tables FOR UPDATE
  USING (
    get_my_staff_role() IN ('cashier', 'admin')
  );

-- ============================================================
-- SAFE FUNCTION for customers to start a new table session
-- (runs with elevated privileges but only does ONE narrow thing:
--  claim a vacant table with a fresh session_id)
-- ============================================================
CREATE OR REPLACE FUNCTION start_table_session(p_table_number TEXT, p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tables
  SET status = 'active', current_session_id = p_session_id
  WHERE table_number = p_table_number
    AND status = 'vacant';  -- only claim if currently vacant — prevents hijacking an active table
END;
$$;

-- Allow anyone (including anonymous customers) to call this narrow function
GRANT EXECUTE ON FUNCTION start_table_session(TEXT, UUID) TO anon, authenticated;

-- ============================================================
-- TABLE TRANSFER / MERGE FUNCTIONS (cashier/admin only)
-- ============================================================

-- Scenario A: Merge — fold source table's session into target table's session
-- Kitchen sees no change in behavior; orders just now belong to target table.
CREATE OR REPLACE FUNCTION merge_table_session(p_source_table_number TEXT, p_target_table_number TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_table RECORD;
  v_target_table RECORD;
BEGIN
  IF get_my_staff_role() NOT IN ('cashier', 'admin') THEN
    RAISE EXCEPTION 'Not authorized to merge tables';
  END IF;

  SELECT * INTO v_source_table FROM tables WHERE table_number = p_source_table_number;
  SELECT * INTO v_target_table FROM tables WHERE table_number = p_target_table_number;

  IF v_source_table.current_session_id IS NULL THEN
    RAISE EXCEPTION 'Source table has no active session';
  END IF;
  IF v_target_table.current_session_id IS NULL THEN
    RAISE EXCEPTION 'Target table has no active session to merge into';
  END IF;

  -- Reassign all of source table's orders to target table + target session
  UPDATE orders
  SET table_id = v_target_table.id, session_id = v_target_table.current_session_id
  WHERE table_id = v_source_table.id AND session_id = v_source_table.current_session_id;

  -- Free up the source table
  UPDATE tables
  SET status = 'vacant', current_session_id = NULL
  WHERE id = v_source_table.id;
END;
$$;

GRANT EXECUTE ON FUNCTION merge_table_session(TEXT, TEXT) TO authenticated;

-- Scenario B: Relocate — move a session wholesale to a different (vacant) table
CREATE OR REPLACE FUNCTION relocate_table_session(p_source_table_number TEXT, p_target_table_number TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_table RECORD;
  v_target_table RECORD;
BEGIN
  IF get_my_staff_role() NOT IN ('cashier', 'admin') THEN
    RAISE EXCEPTION 'Not authorized to relocate tables';
  END IF;

  SELECT * INTO v_source_table FROM tables WHERE table_number = p_source_table_number;
  SELECT * INTO v_target_table FROM tables WHERE table_number = p_target_table_number;

  IF v_source_table.current_session_id IS NULL THEN
    RAISE EXCEPTION 'Source table has no active session';
  END IF;
  IF v_target_table.status != 'vacant' THEN
    RAISE EXCEPTION 'Target table is not vacant — use merge instead';
  END IF;

  -- Move all orders to the new table_id (session_id stays the same)
  UPDATE orders
  SET table_id = v_target_table.id
  WHERE table_id = v_source_table.id AND session_id = v_source_table.current_session_id;

  -- Activate target table with the same session
  UPDATE tables
  SET status = 'active', current_session_id = v_source_table.current_session_id
  WHERE id = v_target_table.id;

  -- Free up the source table
  UPDATE tables
  SET status = 'vacant', current_session_id = NULL
  WHERE id = v_source_table.id;
END;
$$;

GRANT EXECUTE ON FUNCTION relocate_table_session(TEXT, TEXT) TO authenticated;

-- ============================================================
-- SEED: first admin account
-- ============================================================
-- NOTE: This only inserts the `staff` row. You must ALSO create the
-- matching Supabase Auth user first (see scripts/create_first_admin.js),
-- then come back and update the auth_user_id below to match.
--
-- Example (run manually after creating the auth user):
--
-- INSERT INTO staff (phone, auth_user_id, name, role)
-- VALUES ('0205512345', '<paste-auth-user-uuid-here>', 'Admin', 'admin');
