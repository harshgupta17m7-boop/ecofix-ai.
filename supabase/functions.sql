-- EcoFix AI PostGIS Functions and Triggers

-- 1. Sync Latitude/Longitude fields to geography Location column
CREATE OR REPLACE FUNCTION public.sync_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind sync trigger to reports
CREATE TRIGGER trigger_sync_reports_geography
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.sync_geography();

-- Bind sync trigger to projects
CREATE TRIGGER trigger_sync_projects_geography
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.sync_geography();


-- 2. Geospatial Lookups: Check for existing projects within radius (default 25 meters)
CREATE OR REPLACE FUNCTION public.find_nearby_projects(
    user_latitude DOUBLE PRECISION,
    user_longitude DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 25.0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    status TEXT,
    before_image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.latitude,
        p.longitude,
        ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)::geography
        ) AS distance_meters,
        p.status,
        p.before_image_url
    FROM 
        public.projects p
    WHERE 
        ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(user_longitude, user_latitude), 4326)::geography,
            radius_meters
        )
        AND p.status = 'active'
    ORDER BY 
        distance_meters ASC;
END;
$$ LANGUAGE plpgsql;


-- 3. Crowdfund contribution trigger (automatically increments project current_funds when a ledger entry is made)
CREATE OR REPLACE FUNCTION public.update_project_funds()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects
    SET current_funds = current_funds + NEW.amount
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_funds
AFTER INSERT ON public.funding_ledger
FOR EACH ROW EXECUTE FUNCTION public.update_project_funds();


-- 4. User Rewards Trigger (automatically awards 100 points to volunteer when task is completed)
CREATE OR REPLACE FUNCTION public.award_volunteer_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award if task status transitions to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_to IS NOT NULL THEN
        UPDATE public.profiles
        SET points = points + 100
        WHERE id = NEW.assigned_to;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_volunteer_points
AFTER UPDATE OF status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.award_volunteer_points();
