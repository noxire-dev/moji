-- Moji Database Schema for Supabase
-- Run this in the Supabase SQL Editor after creating your project

-- ============================================
-- TABLES
-- ============================================

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content VARCHAR(500) NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 3),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_notes_workspace_id ON notes(workspace_id);
CREATE INDEX idx_tasks_done ON tasks(done);

-- Composite indexes for optimized query patterns
-- Tasks: filter by workspace and done status (common in TaskList)
CREATE INDEX idx_tasks_workspace_done ON tasks(workspace_id, done);

-- Notes: filter by workspace and order by updated_at (common in NoteList)
CREATE INDEX idx_notes_workspace_updated ON notes(workspace_id, updated_at DESC);

-- Pages: filter by workspace and order by updated_at (common in Sidebar)
CREATE INDEX idx_pages_workspace_updated ON pages(workspace_id, updated_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces" ON workspaces
    FOR DELETE USING (auth.uid() = user_id);

-- Task policies (verify ownership through workspace)
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tasks.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tasks.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tasks.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = tasks.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

-- Note policies (verify ownership through workspace)
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = notes.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = notes.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = notes.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE workspaces.id = notes.workspace_id
            AND workspaces.user_id = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Create default workspace on user signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.workspaces (name, description, user_id)
    VALUES ('Personal', 'Your personal workspace', NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create default workspace when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
