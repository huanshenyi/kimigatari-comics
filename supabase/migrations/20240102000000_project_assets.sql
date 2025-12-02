-- Project Assets Migration
-- Links assets to projects (many-to-many relationship)

-- Step 1: Drop existing RLS policies that depend on project_id
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
DROP POLICY IF EXISTS "Users can create assets" ON assets;
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON assets;

-- Step 2: Drop index that depends on project_id
DROP INDEX IF EXISTS idx_assets_project_id;

-- Step 3: Add user_id to assets table (for user's asset library)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 4: Drop project_id from assets (moving to junction table)
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_project_id_fkey;
ALTER TABLE assets DROP COLUMN IF EXISTS project_id;

-- Step 3: Create junction table for project-asset relationship
CREATE TABLE IF NOT EXISTS project_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('character', 'background', 'reference')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_asset ON project_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);

-- Enable RLS
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_assets
CREATE POLICY "Users can view project assets of own projects" ON project_assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can add assets to own projects" ON project_assets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can remove assets from own projects" ON project_assets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_assets.project_id AND projects.user_id = auth.uid())
  );

-- Update assets RLS to use user_id instead of project_id
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
DROP POLICY IF EXISTS "Users can create assets" ON assets;
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON assets;

CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can create assets" ON assets
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (user_id IS NULL OR user_id = auth.uid());
