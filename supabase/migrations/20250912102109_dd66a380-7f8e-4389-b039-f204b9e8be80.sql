-- Update clients table structure
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS ting_poc,
DROP COLUMN IF EXISTS total_hours,
DROP COLUMN IF EXISTS hours_consumed,
ADD COLUMN client_poc_contact_number text,
ADD COLUMN ting_poc_primary uuid REFERENCES public.admins(id),
ADD COLUMN ting_poc_secondary uuid REFERENCES public.admins(id);

-- Update admins table 
ALTER TABLE public.admins 
RENAME COLUMN contact TO contact_number;

-- Update work_logs table
ALTER TABLE public.work_logs 
RENAME COLUMN description TO work_description;

-- Create payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_remaining numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  payment_term payment_term NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy for payments
CREATE POLICY "Superadmin full access to payments" 
ON public.payments 
FOR ALL 
USING (true);

-- Add trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();