import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  domain: string | null;
  project_name: string | null;
  client_poc_name: string | null;
  poc_email: string | null;
  client_poc_contact_number: string | null;
  cost_for_year: number | null;
  payment_term: string | null;
  ting_poc_primary: string | null;
  ting_poc_secondary: string | null;
  project_slug: string;
  amc_start_date: string | null;
  amc_end_date: string | null;
}

interface ClientFormData {
  domain: string;
  project_name: string;
  client_poc_name: string;
  poc_email: string;
  client_poc_contact_number: string;
  cost_for_year: number;
  payment_term: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  ting_poc_primary: string;
  ting_poc_secondary: string;
  amc_start_date: string;
  amc_end_date: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

export const ClientManagement = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    domain: '',
    project_name: '',
    client_poc_name: '',
    poc_email: '',
    client_poc_contact_number: '',
    cost_for_year: 0,
    payment_term: 'Monthly',
    ting_poc_primary: '',
    ting_poc_secondary: '',
    amc_start_date: '',
    amc_end_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchAdmins();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

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
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...formData, project_slug: '' }]); // Trigger will generate actual slug from domain

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
      domain: client.domain || '',
      project_name: client.project_name || '',
      client_poc_name: client.client_poc_name || '',
      poc_email: client.poc_email || '',
      client_poc_contact_number: client.client_poc_contact_number || '',
      cost_for_year: client.cost_for_year || 0,
      payment_term: (client.payment_term as 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly') || 'Monthly',
      ting_poc_primary: client.ting_poc_primary || '',
      ting_poc_secondary: client.ting_poc_secondary || '',
      amc_start_date: client.amc_start_date || '',
      amc_end_date: client.amc_end_date || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

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
      payment_term: 'Monthly',
      ting_poc_primary: '',
      ting_poc_secondary: '',
      amc_start_date: '',
      amc_end_date: '',
    });
  };

  const getTingPocNames = (primaryId: string | null, secondaryId: string | null) => {
    const primary = primaryId ? admins.find(admin => admin.id === primaryId)?.name : null;
    const secondary = secondaryId ? admins.find(admin => admin.id === secondaryId)?.name : null;
    
    const pocs = [];
    if (primary) pocs.push(`Primary: ${primary}`);
    if (secondary) pocs.push(`Secondary: ${secondary}`);
    
    return pocs.length > 0 ? pocs.join(', ') : 'None';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="cost_for_year">Cost for Year</Label>
                  <Input
                    id="cost_for_year"
                    type="number"
                    value={formData.cost_for_year}
                    onChange={(e) => setFormData({...formData, cost_for_year: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_term">Payment Term</Label>
                  <Select
                    value={formData.payment_term}
                    onValueChange={(value: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly') => 
                      setFormData({...formData, payment_term: value})
                    }
                  >
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
                  <Select
                    value={formData.ting_poc_primary}
                    onValueChange={(value) => setFormData({...formData, ting_poc_primary: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary POC" />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ting_poc_secondary">Ting POC Secondary</Label>
                  <Select
                    value={formData.ting_poc_secondary}
                    onValueChange={(value) => setFormData({...formData, ting_poc_secondary: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary POC" />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
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
                <div className="col-span-2">
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Client POC</TableHead>
                <TableHead>POC Email</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Cost/Year</TableHead>
                <TableHead>Payment Term</TableHead>
                <TableHead>Ting POC</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow 
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/${client.project_slug}/work-log`)}
                >
                  <TableCell className="font-medium">{client.project_name}</TableCell>
                  <TableCell>{client.domain}</TableCell>
                  <TableCell>{client.client_poc_name}</TableCell>
                  <TableCell>{client.poc_email}</TableCell>
                  <TableCell>{client.client_poc_contact_number}</TableCell>
                  <TableCell>${client.cost_for_year?.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{client.payment_term?.replace('_', ' ')}</TableCell>
                  <TableCell className="max-w-32 truncate">
                    {getTingPocNames(client.ting_poc_primary, client.ting_poc_secondary)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/${client.project_slug}/work-log`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {clients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found. Add your first client to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};