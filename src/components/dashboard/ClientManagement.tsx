import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  project_slug: string;
  project_url: string | null;
  client_name: string;
  email: string;
  contact: string | null;
  logo_url: string | null;
  amc_start_date: string | null;
  amc_end_date: string | null;
  total_hours: number;
  hours_consumed: number;
}

interface ClientFormData {
  project_slug: string;
  project_url: string;
  client_name: string;
  email: string;
  contact: string;
  amc_start_date: string;
  amc_end_date: string;
  total_hours: number;
}

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    project_slug: '',
    project_url: '',
    client_name: '',
    email: '',
    contact: '',
    amc_start_date: '',
    amc_end_date: '',
    total_hours: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
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
          .insert([formData]);

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
      project_slug: client.project_slug,
      project_url: client.project_url || '',
      client_name: client.client_name,
      email: client.email,
      contact: client.contact || '',
      amc_start_date: client.amc_start_date || '',
      amc_end_date: client.amc_end_date || '',
      total_hours: client.total_hours,
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
      project_slug: '',
      project_url: '',
      client_name: '',
      email: '',
      contact: '',
      amc_start_date: '',
      amc_end_date: '',
      total_hours: 0,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
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
                  <Label htmlFor="project_slug">Project Slug *</Label>
                  <Input
                    id="project_slug"
                    value={formData.project_slug}
                    onChange={(e) => setFormData({...formData, project_slug: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="project_url">Project URL</Label>
                  <Input
                    id="project_url"
                    type="url"
                    value={formData.project_url}
                    onChange={(e) => setFormData({...formData, project_url: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({...formData, total_hours: parseInt(e.target.value) || 0})}
                  />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Project Slug</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Consumed</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.client_name}</TableCell>
                <TableCell>{client.project_slug}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.total_hours}h</TableCell>
                <TableCell>{client.hours_consumed}h</TableCell>
                <TableCell>{client.total_hours - client.hours_consumed}h</TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
  );
};