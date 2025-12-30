-- Add Pages table to Moji
-- Run this in Supabase SQL Editor if you already have the base schema

-- ============================================
-- PAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT DEFAULT '',
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages(workspace_id);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pages" ON pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces 
            WHERE workspaces.id = pages.workspace_id 
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own pages" ON pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces 
            WHERE workspaces.id = pages.workspace_id 
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own pages" ON pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspaces 
            WHERE workspaces.id = pages.workspace_id 
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own pages" ON pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspaces 
            WHERE workspaces.id = pages.workspace_id 
            AND workspaces.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

