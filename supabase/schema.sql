-- EcoFix AI Supabase DB Schema
-- Enables PostGIS extension for spatial queries and indexing
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Reports Table (Raw user uploads with visual evidence & GPS data)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326), -- PostGIS Point geometry
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'bypassed')) DEFAULT 'pending',
    hazard_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing for geospatial lookups on reports
CREATE INDEX IF NOT EXISTS reports_location_idx ON public.reports USING GIST (location);

-- RLS for Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to reports" ON public.reports
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Projects Table (Consolidated civic action project threads)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326),
    status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    current_funds NUMERIC(10, 2) DEFAULT 0.00,
    volumetric_debris TEXT, -- e.g., "4.2 cubic yards of debris"
    safety_flags TEXT[] DEFAULT '{}', -- e.g., ['sharp_objects', 'toxic_substances']
    feasibility_score INT CHECK (feasibility_score BETWEEN 0 AND 100),
    before_image_url TEXT NOT NULL,
    after_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexing for geospatial lookups on projects
CREATE INDEX IF NOT EXISTS projects_location_idx ON public.projects USING GIST (location);

-- RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to modify projects" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Tasks Table (Billboard of micro-tasks for volunteers)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    role_required TEXT NOT NULL, -- e.g., 'Heavy Lifter', 'Sorter', 'Supply Coordinator'
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('open', 'pledged', 'completed')) DEFAULT 'open',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tasks" ON public.tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update/pledge tasks" ON public.tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Funding Ledger Table (Crowdsourced ledger for tool rental / dump fees)
CREATE TABLE IF NOT EXISTS public.funding_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    backer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Funding Ledger
ALTER TABLE public.funding_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to funding" ON public.funding_ledger
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to back projects" ON public.funding_ledger
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
