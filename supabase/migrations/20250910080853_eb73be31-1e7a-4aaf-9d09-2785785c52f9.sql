-- Create enum types
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'client');
CREATE TYPE public.work_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table for authentication
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'client',
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_slug TEXT NOT NULL UNIQUE,
    project_url TEXT,
    client_name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT,
    logo_url TEXT,
    amc_start_date DATE,
    amc_end_date DATE,
    total_hours INTEGER DEFAULT 0,
    hours_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admins table
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client-Admin mapping (many-to-many)
CREATE TABLE public.client_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    UNIQUE(client_id, admin_id)
);

-- Work logs table
CREATE TABLE public.work_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    hours_consumed DECIMAL(4,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    status work_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hour requests table
CREATE TABLE public.hour_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    requested_hours INTEGER NOT NULL,
    status request_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for superadmin access
CREATE POLICY "Superadmin full access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Superadmin full access to clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Superadmin full access to admins" ON public.admins FOR ALL USING (true);
CREATE POLICY "Superadmin full access to client_admins" ON public.client_admins FOR ALL USING (true);
CREATE POLICY "Superadmin full access to work_logs" ON public.work_logs FOR ALL USING (true);
CREATE POLICY "Superadmin full access to hour_requests" ON public.hour_requests FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON public.work_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hour_requests_updated_at BEFORE UPDATE ON public.hour_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dummy data
-- Admins
INSERT INTO public.admins (name, email, contact) VALUES
('Rahul Sharma', 'rahul.sharma@agency.com', '9876543210'),
('Anita Verma', 'anita.verma@agency.com', '9988776655');

-- Clients
INSERT INTO public.clients (project_slug, project_url, client_name, email, contact, amc_start_date, amc_end_date, total_hours, hours_consumed) VALUES
('projectalpha', 'https://alpha.com', 'Alpha Pvt Ltd', 'contact@alpha.com', '9112233445', '2025-01-01', '2025-12-31', 100, 15),
('projectbeta', 'https://beta.com', 'Beta Technologies', 'hello@beta.com', '9223344556', '2025-02-01', '2026-01-31', 80, 3);

-- Get admin and client IDs for mapping
DO $$
DECLARE
    rahul_id UUID;
    anita_id UUID;
    alpha_id UUID;
    beta_id UUID;
BEGIN
    SELECT id INTO rahul_id FROM public.admins WHERE email = 'rahul.sharma@agency.com';
    SELECT id INTO anita_id FROM public.admins WHERE email = 'anita.verma@agency.com';
    SELECT id INTO alpha_id FROM public.clients WHERE project_slug = 'projectalpha';
    SELECT id INTO beta_id FROM public.clients WHERE project_slug = 'projectbeta';
    
    -- Client-Admin mapping
    INSERT INTO public.client_admins (client_id, admin_id) VALUES
    (alpha_id, rahul_id),
    (alpha_id, anita_id),
    (beta_id, anita_id);
    
    -- Work logs
    INSERT INTO public.work_logs (client_id, date, description, hours_consumed, start_date, end_date, status) VALUES
    (alpha_id, '2025-08-01', 'Website speed optimization', 5.00, '2025-08-01', '2025-08-02', 'completed'),
    (alpha_id, '2025-08-10', 'Homepage redesign', 10.00, '2025-08-10', '2025-08-15', 'in_progress'),
    (beta_id, '2025-08-05', 'Bug fixes in contact form', 3.00, '2025-08-05', '2025-08-06', 'completed');
    
    -- Hour requests
    INSERT INTO public.hour_requests (client_id, requested_hours, status) VALUES
    (alpha_id, 20, 'pending'),
    (beta_id, 10, 'approved');
END $$;