-- Agent 3: Scheduled Changes table
-- Run this migration after the main Prisma migrations

CREATE TABLE IF NOT EXISTS scheduled_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('toggle_on', 'toggle_off', 'update_targeting')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  payload JSONB,
  executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_changes_pending ON scheduled_changes (scheduled_at) WHERE executed = false;
CREATE INDEX idx_scheduled_changes_flag ON scheduled_changes (flag_id);
