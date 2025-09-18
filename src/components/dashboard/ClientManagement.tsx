import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Users, Eye, FileText, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatRupees } from '@/lib/utils';
import { InvoiceManagement } from './InvoiceManagement';
import { ContractManagement } from './ContractManagement';
import { DocumentManagement } from './DocumentManagement';

interface Client {
  id: string;
  domain: string;
  project_name: string;
  client_poc_name: string;
  poc_email: string;
  client_poc_contact_number: string;
  cost_for_year: number;
  payment_term: string;
  ting_poc_primary: string | null;
  ting_poc_secondary: string | null;
  project_slug: string;
  amc_start_date: string | null;
  amc_end_date: string | null;
  primary_poc_name?: { name: string };
  secondary_poc_name?: { name: string };
  logo_url?: string;
  client_name?: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  contact_number: string;
}

interface ClientFormData {
  domain: string;
  project_name: string;
  client_poc_name: string;
  poc_email: string;
  client_poc_contact_number: string;
  cost_for_year: number;
  hours_assigned_year: number;
  payment_term: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  ting_poc_primary: string;
  ting_poc_secondary: string;
  amc_start_date: string;
  amc_end_date: string;
}

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    domain: '',
    project_name: '',
    client_poc_name: '',
    poc_email: '',
    client_poc_contact_number: '',
    cost_for_year: 0,
    hours_assigned_year: 0,
    payment_term: 'Monthly',
    ting_poc_primary: '',
    ting_poc_secondary: '',
    amc_start_date: '',
    amc_end_date: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate project slug from domain
  const generateProjectSlug = (domain: string): string => {
    // Extract second-level domain (e.g., "example" from "https://www.example.com")
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    const secondLevelDomain = cleanDomain.split('.')[0];
    return secondLevelDomain.toLowerCase();
  };

  useEffect(() => {
    fetchClients();
    fetchAdmins();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          primary_poc_name:admins!clients_ting_poc_primary_fkey(name),
          secondary_poc_name:admins!clients_ting_poc_secondary_fkey(name)
        `)
        .order('project_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email, contact_number')
        .order('name');

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent same admin being assigned as both primary and secondary
    if (formData.ting_poc_primary && formData.ting_poc_primary === formData.ting_poc_secondary) {
      toast({
        title: "Error",
        description: "Primary and Secondary POCs cannot be the same person",
        variant: "destructive",
      });
      return;
    }
    
    const clientData = {
      ...formData,
      project_slug: generateProjectSlug(formData.domain),
      ting_poc_primary: formData.ting_poc_primary === "none" ? null : formData.ting_poc_primary,
      ting_poc_secondary: formData.ting_poc_secondary === "none" ? null : formData.ting_poc_secondary,
    };
    
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Client created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      domain: client.domain,
      project_name: client.project_name,
      client_poc_name: client.client_poc_name,
      poc_email: client.poc_email,
      client_poc_contact_number: client.client_poc_contact_number,
      cost_for_year: client.cost_for_year,
      hours_assigned_year: (client as any).hours_assigned_year || 0,
      payment_term: client.payment_term as 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly',
      ting_poc_primary: client.ting_poc_primary || '',
      ting_poc_secondary: client.ting_poc_secondary || '',
      amc_start_date: client.amc_start_date || '',
      amc_end_date: client.amc_end_date || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      domain: '',
      project_name: '',
      client_poc_name: '',
      poc_email: '',
      client_poc_contact_number: '',
      cost_for_year: 0,
      hours_assigned_year: 0,
      payment_term: 'Monthly',
      ting_poc_primary: '',
      ting_poc_secondary: '',
      amc_start_date: '',
      amc_end_date: '',
    });
  };

  const getTingPocNames = (client: Client) => {
    return (
      <div className="flex flex-col gap-1">
        {client.primary_poc_name?.name && (
          <span className="text-red-600 font-medium">
            {client.primary_poc_name.name}
          </span>
        )}
        {client.secondary_poc_name?.name && (
          <span className="text-blue-600 font-medium">
            {client.secondary_poc_name.name}
          </span>
        )}
        {!client.primary_poc_name?.name && !client.secondary_poc_name?.name && (
          <span className="text-muted-foreground">Not assigned</span>
        )}
      </div>
    );
  };

  const getClientGroup = (cost: number) => {
    if (cost >= 1000000) return { name: 'Qode Ultra', bgClass: 'bg-qodeUltra-bg', textClass: 'text-qodeUltra-text' };
    if (cost >= 600000) return { name: 'Qode Pro', bgClass: 'bg-qodePro-bg', textClass: 'text-qodePro-text' };
    if (cost >= 300000) return { name: 'Qode Max', bgClass: 'bg-qodeMax-bg', textClass: 'text-qodeMax-text' };
    if (cost >= 10000) return { name: 'Qode Mini', bgClass: 'bg-qodeMini-bg', textClass: 'text-qodeMini-text' };
    return { name: 'Qode Mini', bgClass: 'bg-qodeMini-bg', textClass: 'text-qodeMini-text' };
  };

  const handleViewWorkLogs = (client: Client) => {
    navigate(`/${client.project_slug}/work-log`);
  };

  const handleViewDetails = (client: Client) => {
    setViewingClient(client);
  };

  const handleBackToList = () => {
    setViewingClient(null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // If viewing a specific client's details
  if (viewingClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleBackToList}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Client List
                </Button>
                <div>
                  <CardTitle>{viewingClient.project_name}</CardTitle>
                  <p className="text-muted-foreground">{viewingClient.domain}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {viewingClient.payment_term?.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoices">
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="contracts">
              <FileText className="h-4 w-4 mr-2" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoiceManagement 
              clientId={viewingClient.id} 
              clientName={viewingClient.project_name || 'Unknown Client'} 
            />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractManagement 
              clientId={viewingClient.id} 
              clientName={viewingClient.project_name || 'Unknown Client'} 
            />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement 
              clientId={viewingClient.id} 
              clientName={viewingClient.project_name || 'Unknown Client'} 
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Management
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    placeholder="example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_poc_name">Client POC Name *</Label>
                  <Input
                    id="client_poc_name"
                    value={formData.client_poc_name}
                    onChange={(e) => setFormData({...formData, client_poc_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="poc_email">POC Email *</Label>
                  <Input
                    id="poc_email"
                    type="email"
                    value={formData.poc_email}
                    onChange={(e) => setFormData({...formData, poc_email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_poc_contact_number">Client POC Contact Number</Label>
                  <Input
                    id="client_poc_contact_number"
                    value={formData.client_poc_contact_number}
                    onChange={(e) => setFormData({...formData, client_poc_contact_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cost_for_year">Cost for Year (₹)</Label>
                  <Input
                    id="cost_for_year"
                    type="number"
                    value={formData.cost_for_year}
                    onChange={(e) => setFormData({...formData, cost_for_year: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="hours_assigned_year">Hours Assigned (per Year)</Label>
                  <Input
                    id="hours_assigned_year"
                    type="number"
                    value={formData.hours_assigned_year}
                    onChange={(e) => setFormData({...formData, hours_assigned_year: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_term">Payment Term</Label>
                  <Select value={formData.payment_term} onValueChange={(value: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly') => setFormData({...formData, payment_term: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ting_poc_primary">Ting POC Primary</Label>
                  <Select value={formData.ting_poc_primary} onValueChange={(value) => setFormData({...formData, ting_poc_primary: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary POC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {admins
                        .filter(admin => admin.id !== formData.ting_poc_secondary && formData.ting_poc_secondary !== "none")
                        .map(admin => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ting_poc_secondary">Ting POC Secondary</Label>
                  <Select value={formData.ting_poc_secondary} onValueChange={(value) => setFormData({...formData, ting_poc_secondary: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary POC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {admins
                        .filter(admin => admin.id !== formData.ting_poc_primary && formData.ting_poc_primary !== "none")
                        .map(admin => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amc_start_date">AMC Start Date</Label>
                  <Input
                    id="amc_start_date"
                    type="date"
                    value={formData.amc_start_date}
                    onChange={(e) => setFormData({...formData, amc_start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="amc_end_date">AMC End Date</Label>
                  <Input
                    id="amc_end_date"
                    type="date"
                    value={formData.amc_end_date}
                    onChange={(e) => setFormData({...formData, amc_end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No clients found. Add your first client to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const group = getClientGroup(client.cost_for_year || 0);
              return (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-4">
                    {/* Logo */}
                    <div className="flex justify-center mb-2">
                      {client.logo_url ? (
                        <img 
                          src={client.logo_url} 
                          alt={`${client.client_name || client.project_name} logo`}
                          className="w-16 h-16 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Client Name */}
                    <CardTitle className="text-lg">
                      {client.client_name || client.project_name}
                    </CardTitle>
                    
                    {/* Group Badge */}
                    <Badge 
                      className={`${group.bgClass} ${group.textClass} border-0 font-medium`}
                      variant="outline"
                    >
                      {group.name}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Client POC Names with color coding */}
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Ting POCs</div>
                      {getTingPocNames(client)}
                    </div>
                    
                    {/* Client POC Details */}
                    <div>
                      <div className="text-sm font-medium">{client.client_poc_name}</div>
                      <div className="text-sm text-muted-foreground">{client.poc_email}</div>
                      <div className="text-sm text-muted-foreground">{client.client_poc_contact_number}</div>
                    </div>
                    
                    {/* AMC Cost */}
                    <div className="text-lg font-semibold text-primary">
                      {formatRupees(client.cost_for_year || 0)}
                    </div>
                    
                    {/* Start & End Dates */}
                    <div className="text-sm text-muted-foreground">
                      {client.amc_start_date && client.amc_end_date && (
                        <div>
                          {new Date(client.amc_start_date).toLocaleDateString()} - {new Date(client.amc_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        title="Edit Client"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client)}
                        title="Delete Client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewWorkLogs(client)}
                        title="View Work Logs"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(client)}
                        title="View Documents"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};