-- =============================================
-- Community Projects Feature - Database Schema
-- =============================================
-- This migration creates tables for the Community Projects feature
-- where users can create, join, and collaborate on community initiatives.
-- =============================================

-- Drop existing tables if they exist (for clean re-runs during development)
DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS project_participants CASCADE;
DROP TABLE IF EXISTS community_projects CASCADE;

-- =============================================
-- 1. COMMUNITY PROJECTS TABLE
-- =============================================
-- Stores all community project information
CREATE TABLE community_projects (
    id BIGSERIAL PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    max_participants INTEGER,
    goals TEXT,
    skills_needed TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    CONSTRAINT valid_category CHECK (category IN (
        'Community Development',
        'Technology',
        'Education',
        'Environment',
        'Arts & Culture',
        'Health & Wellness',
        'Other'
    )),
    CONSTRAINT positive_max_participants CHECK (max_participants IS NULL OR max_participants > 0),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_community_projects_creator ON community_projects(creator_id);
CREATE INDEX idx_community_projects_status ON community_projects(status);
CREATE INDEX idx_community_projects_category ON community_projects(category);
CREATE INDEX idx_community_projects_created_at ON community_projects(created_at DESC);

-- =============================================
-- 2. PROJECT PARTICIPANTS TABLE
-- =============================================
-- Tracks which users have joined which projects
CREATE TABLE project_participants (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_participant_role CHECK (role IN ('creator', 'member', 'moderator')),
    CONSTRAINT unique_project_participant UNIQUE (project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_project_participants_project ON project_participants(project_id);
CREATE INDEX idx_project_participants_user ON project_participants(user_id);
CREATE INDEX idx_project_participants_joined_at ON project_participants(joined_at DESC);

-- =============================================
-- 3. PROJECT UPDATES TABLE
-- =============================================
-- Stores updates, announcements, and discussion posts for projects
CREATE TABLE project_updates (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    update_type VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_update_type CHECK (update_type IN ('general', 'announcement', 'milestone', 'discussion'))
);

-- Create indexes for better query performance
CREATE INDEX idx_project_updates_project ON project_updates(project_id);
CREATE INDEX idx_project_updates_user ON project_updates(user_id);
CREATE INDEX idx_project_updates_created_at ON project_updates(created_at DESC);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Community Projects Policies
-- Anyone can view all projects
CREATE POLICY "Anyone can view community projects"
    ON community_projects FOR SELECT
    TO authenticated
    USING (true);

-- Users can create projects
CREATE POLICY "Users can create community projects"
    ON community_projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own projects
CREATE POLICY "Creators can update their projects"
    ON community_projects FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own projects
CREATE POLICY "Creators can delete their projects"
    ON community_projects FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id);

-- Project Participants Policies
-- Anyone can view project participants
CREATE POLICY "Anyone can view project participants"
    ON project_participants FOR SELECT
    TO authenticated
    USING (true);

-- Users can join projects (insert themselves as participants)
CREATE POLICY "Users can join projects"
    ON project_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can leave projects (delete their own participation)
CREATE POLICY "Users can leave projects"
    ON project_participants FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Project creators and moderators can manage participants
CREATE POLICY "Project creators can manage participants"
    ON project_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM community_projects
            WHERE id = project_participants.project_id
            AND creator_id = auth.uid()
        )
    );

-- Project Updates Policies
-- Anyone can view project updates
CREATE POLICY "Anyone can view project updates"
    ON project_updates FOR SELECT
    TO authenticated
    USING (true);

-- Project participants can create updates
CREATE POLICY "Participants can create project updates"
    ON project_updates FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND (
            EXISTS (
                SELECT 1 FROM project_participants
                WHERE project_id = project_updates.project_id
                AND user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM community_projects
                WHERE id = project_updates.project_id
                AND creator_id = auth.uid()
            )
        )
    );

-- Users can update their own updates
CREATE POLICY "Users can update their own project updates"
    ON project_updates FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own updates
CREATE POLICY "Users can delete their own project updates"
    ON project_updates FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =============================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on community_projects
CREATE TRIGGER update_community_projects_updated_at
    BEFORE UPDATE ON community_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add creator as participant when project is created
CREATE OR REPLACE FUNCTION add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_participants (project_id, user_id, role)
    VALUES (NEW.id, NEW.creator_id, 'creator');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to add creator as participant
CREATE TRIGGER add_creator_participant_trigger
    AFTER INSERT ON community_projects
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_participant();

-- =============================================
-- 6. SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment the following to insert sample data for testing

/*
-- Insert sample projects (replace with actual user IDs from your auth.users table)
INSERT INTO community_projects (creator_id, title, description, category, status, start_date, max_participants, goals, skills_needed)
VALUES 
    (
        'your-user-uuid-here',
        'Community Garden Initiative',
        'Let''s build a sustainable community garden where residents can grow organic vegetables and learn about urban farming.',
        'Environment',
        'planning',
        CURRENT_DATE + INTERVAL '30 days',
        20,
        'Create raised beds, install irrigation system, organize planting schedule, host workshops',
        'Gardening, Carpentry, Community Organizing'
    ),
    (
        'your-user-uuid-here',
        'Local Coding Bootcamp',
        'Free coding classes for beginners in our community. We''ll teach web development basics using modern technologies.',
        'Technology',
        'active',
        CURRENT_DATE,
        30,
        'Teach HTML/CSS/JavaScript, Build portfolio projects, Help students get jobs',
        'Web Development, Teaching, Mentoring'
    );
*/

-- =============================================
-- END OF MIGRATION
-- =============================================

-- Verify tables were created
SELECT 'Migration completed successfully!' AS status;
SELECT 
    'community_projects' AS table_name,
    COUNT(*) AS row_count
FROM community_projects
UNION ALL
SELECT 
    'project_participants' AS table_name,
    COUNT(*) AS row_count
FROM project_participants
UNION ALL
SELECT 
    'project_updates' AS table_name,
    COUNT(*) AS row_count
FROM project_updates;
