-- Create storage buckets for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-invoices', 'client-invoices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('client-contracts', 'client-contracts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  contract_title TEXT NOT NULL,
  contract_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Create client_documents table
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('SOW', 'NDA', 'Brand Guidelines', 'Other')),
  doc_title TEXT NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT client_documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Superadmin full access to invoices" 
ON public.invoices 
FOR ALL 
USING (true);

-- Create RLS policies for contracts
CREATE POLICY "Superadmin full access to contracts" 
ON public.contracts 
FOR ALL 
USING (true);

-- Create RLS policies for client_documents
CREATE POLICY "Superadmin full access to client_documents" 
ON public.client_documents 
FOR ALL 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_documents_updated_at
BEFORE UPDATE ON public.client_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for client-invoices bucket
CREATE POLICY "Authenticated users can view invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-invoices');

CREATE POLICY "Authenticated users can upload invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-invoices');

CREATE POLICY "Authenticated users can update invoices" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'client-invoices');

CREATE POLICY "Authenticated users can delete invoices" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-invoices');

-- Storage policies for client-contracts bucket
CREATE POLICY "Authenticated users can view contracts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-contracts');

CREATE POLICY "Authenticated users can upload contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-contracts');

CREATE POLICY "Authenticated users can update contracts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'client-contracts');

CREATE POLICY "Authenticated users can delete contracts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-contracts');

-- Storage policies for client-documents bucket
CREATE POLICY "Authenticated users can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can update documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can delete documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-documents');