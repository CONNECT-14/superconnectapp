-- Add project_id to posts so community posts can be linked to a project
ALTER TABLE posts ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Index for fast lookup of posts by project
CREATE INDEX IF NOT EXISTS posts_project_id_idx ON posts (project_id);
