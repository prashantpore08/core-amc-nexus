-- Add hours_assigned_year column to clients table
ALTER TABLE public.clients 
ADD COLUMN hours_assigned_year numeric DEFAULT 0;