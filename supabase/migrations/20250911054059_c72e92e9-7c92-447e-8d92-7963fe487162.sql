-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SET search_path = public;