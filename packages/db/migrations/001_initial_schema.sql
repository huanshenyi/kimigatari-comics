-- Kimigatari Comics Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  plot TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  layout_data JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, page_number)
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('character', 'background', 'generated', 'reference')),
  name VARCHAR(200) NOT NULL,
  s3_key TEXT NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_page_number ON pages(project_id, page_number);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_s3_key ON assets(s3_key);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to projects
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to pages
DROP TRIGGER IF EXISTS pages_updated_at ON pages;
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see/modify their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Pages: Users can access pages of their projects
CREATE POLICY "Users can view pages of own projects" ON pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pages.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can create pages in own projects" ON pages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pages.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update pages in own projects" ON pages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pages.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete pages in own projects" ON pages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pages.project_id AND projects.user_id = auth.uid())
  );

-- Assets: Users can access assets of their projects or unassigned assets
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (
    project_id IS NULL OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can create assets" ON assets
  FOR INSERT WITH CHECK (
    project_id IS NULL OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (
    project_id IS NULL OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (
    project_id IS NULL OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

-- Service role bypass for server-side operations
-- Note: Service role key bypasses RLS by default in Supabase
