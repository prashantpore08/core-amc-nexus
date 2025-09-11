-- Add payment_term enum
CREATE TYPE payment_term AS ENUM ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly');

-- Update clients table with new fields
ALTER TABLE public.clients 
ADD COLUMN domain text,
ADD COLUMN project_name text,
ADD COLUMN client_poc_name text,
ADD COLUMN poc_email text UNIQUE,
ADD COLUMN cost_for_year numeric,
ADD COLUMN payment_term payment_term,
ADD COLUMN ting_poc uuid[];

-- Update existing clients table structure
ALTER TABLE public.clients 
ALTER COLUMN client_name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL;

-- Create function to auto-generate project_slug from domain
CREATE OR REPLACE FUNCTION generate_project_slug_from_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract second-level domain from full domain
  -- For example: www.example.com -> example
  NEW.project_slug = CASE 
    WHEN NEW.domain IS NOT NULL THEN 
      regexp_replace(
        regexp_replace(NEW.domain, '^(https?://)?(www\.)?', '', 'i'),
        '\..*$', ''
      )
    ELSE NEW.project_slug
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating project_slug
CREATE TRIGGER trigger_generate_project_slug
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_project_slug_from_domain();