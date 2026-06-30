-- 1. ADD COLUMNS
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS username_is_auto_generated BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS username_prompt_dismissed BOOLEAN DEFAULT false;

-- 2. BACKFILL SCRIPT (generate unique usernames for existing rows)
DO $$
DECLARE
    r RECORD;
    base_slug TEXT;
    candidate_slug TEXT;
    suffix_counter INTEGER;
BEGIN
    FOR r IN SELECT id, name FROM profiles WHERE username IS NULL
    LOOP
        -- Basic slugification: lowercase, replace spaces with underscores, strip invalid chars
        base_slug := lower(r.name);
        base_slug := regexp_replace(base_slug, '\s+', '_', 'g');
        base_slug := regexp_replace(base_slug, '[^a-z0-9_.]', '', 'g');
        
        -- Fallback if name was totally stripped or empty
        IF base_slug IS NULL OR length(base_slug) < 3 THEN
            base_slug := 'user_' || substr(r.id::text, 1, 8);
        END IF;

        -- Trim to 24 chars to leave room for a 5-digit suffix
        base_slug := substr(base_slug, 1, 24);

        candidate_slug := base_slug;
        suffix_counter := 1;

        -- Loop until we find an available username
        WHILE EXISTS (SELECT 1 FROM profiles WHERE lower(username) = lower(candidate_slug) AND id != r.id) LOOP
            -- Try appending a random 4 digit number
            candidate_slug := base_slug || '_' || floor(random() * 9000 + 1000)::text;
            suffix_counter := suffix_counter + 1;
            
            -- Failsafe
            IF suffix_counter > 50 THEN
                candidate_slug := base_slug || '_' || substr(md5(random()::text), 1, 6);
            END IF;
        END LOOP;

        UPDATE profiles
        SET 
            username = candidate_slug,
            username_is_auto_generated = true
        WHERE id = r.id;
    END LOOP;
END $$;

-- 3. ENFORCE CONSTRAINTS & INDEXES
-- Now that we have backfilled, we can enforce that username is not null
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;

-- Enforce the regex constraint
ALTER TABLE profiles ADD CONSTRAINT username_format_check CHECK (username ~ '^[a-z0-9_.]{3,30}$');

-- Create a unique case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON profiles (lower(username));

-- 4. SEARCH FUNCTIONALITY (pg_trgm and RPC)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS profiles_name_trgm_idx ON profiles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx ON profiles USING gin (username gin_trgm_ops);

-- Drop if exists just in case
DROP FUNCTION IF EXISTS search_profiles(text, int, int);
DROP FUNCTION IF EXISTS search_profiles(text);

CREATE OR REPLACE FUNCTION search_profiles(search_query text, max_limit int DEFAULT 20, result_offset int DEFAULT 0)
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    match_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.username,
        p.avatar_url,
        p.bio,
        -- Scoring:
        -- 1. Exact username match (score 100)
        -- 2. Username prefix match (score 50)
        -- 3. Name trigram similarity (score 0-1)
        (
            CASE 
                WHEN lower(p.username) = lower(search_query) THEN 100.0
                WHEN lower(p.username) LIKE lower(search_query) || '%' THEN 50.0
                ELSE similarity(p.name, search_query)
            END
        )::REAL AS match_score
    FROM profiles p
    WHERE 
        p.username ILIKE '%' || search_query || '%' OR 
        p.name ILIKE '%' || search_query || '%'
    ORDER BY match_score DESC, p.name ASC
    LIMIT max_limit
    OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;
