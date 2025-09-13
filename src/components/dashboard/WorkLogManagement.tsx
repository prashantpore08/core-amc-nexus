import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkLog {
  id: string;
  client_id: string;
  date: string;
  work_description: string;
  hours_consumed: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  clients: {
    project_name: string;
  };
}

interface Client {
  id: string;
  project_name: string;
}

interface WorkLogFormData {
  client_id: string;
  date: string;
  work_description: string;
  hours_consumed: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export const WorkLogManagement = () => {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<WorkLogFormData>({
    client_id: '',
    date: '',
    work_description: '',
    hours_consumed: 0,
    start_date: '',
    end_date: '',
    status: 'pending',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkLogs();
    fetchClients();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('work_logs')
        .select(`
          *,
          clients(project_name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkLogs(data || []);
    } catch (error) {
      console.error('Error fetching work logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch work logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, project_name')
        .order('project_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingWorkLog) {
        const { error } = await supabase
          .from('work_logs')
          .update(formData)
          .eq('id', editingWorkLog.id);

        if (error) throw error;
        
        // Note: Client hours are now calculated from work logs
        
        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('work_logs')
          .insert([formData]);

        if (error) throw error;
        
        // Note: Client hours are now calculated from work logs
        
        toast({
          title: "Success",
          description: "Work log created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchWorkLogs();
    } catch (error) {
      console.error('Error saving work log:', error);
      toast({
        title: "Error",
        description: "Failed to save work log",
        variant: "destructive",
      });
    }
  };

  // Note: This function is no longer needed as hours are calculated dynamically

  const handleEdit = (workLog: WorkLog) => {
    setEditingWorkLog(workLog);
    setFormData({
      client_id: workLog.client_id,
      date: workLog.date,
      work_description: workLog.work_description,
      hours_consumed: workLog.hours_consumed,
      start_date: workLog.start_date || '',
      end_date: workLog.end_date || '',
      status: workLog.status as 'pending' | 'in_progress' | 'completed',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (workLog: WorkLog) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;

    try {
      const { error } = await supabase
        .from('work_logs')
        .delete()
        .eq('id', workLog.id);

      if (error) throw error;

      // Note: Client hours are calculated dynamically

      toast({
        title: "Success",
        description: "Work log deleted successfully",
      });
      
      fetchWorkLogs();
    } catch (error) {
      console.error('Error deleting work log:', error);
      toast({
        title: "Error",
        description: "Failed to delete work log",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingWorkLog(null);
    setFormData({
      client_id: '',
      date: '',
      work_description: '',
      hours_consumed: 0,
      start_date: '',
      end_date: '',
      status: 'pending',
    });
  };

  const exportToExcel = () => {
    const headers = ['Date', 'Client', 'Description', 'Hours', 'Start Date', 'End Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredWorkLogs.map(log => [
        log.date,
        log.clients.project_name,
        `"${log.work_description}"`,
        log.hours_consumed,
        log.start_date || '',
        log.end_date || '',
        log.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredWorkLogs = workLogs.filter(log => {
    const matchesSearch = log.work_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.clients.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Work Log Management
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Work Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWorkLog ? 'Edit Work Log' : 'Add New Work Log'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_id">Client *</Label>
                    <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours_consumed">Hours Consumed *</Label>
                    <Input
                      id="hours_consumed"
                      type="number"
                      step="0.5"
                      value={formData.hours_consumed}
                      onChange={(e) => setFormData({...formData, hours_consumed: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed') => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="work_description">Work Description *</Label>
                  <Textarea
                    id="work_description"
                    value={formData.work_description}
                    onChange={(e) => setFormData({...formData, work_description: e.target.value})}
                    required
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWorkLog ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by description or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkLogs.map((workLog) => (
              <TableRow key={workLog.id}>
                <TableCell>{new Date(workLog.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{workLog.clients.project_name}</TableCell>
                <TableCell className="max-w-xs truncate">{workLog.work_description}</TableCell>
                <TableCell>{workLog.hours_consumed}h</TableCell>
                <TableCell>
                  {workLog.start_date && workLog.end_date ? 
                    `${new Date(workLog.start_date).toLocaleDateString()} - ${new Date(workLog.end_date).toLocaleDateString()}` : 
                    'N/A'
                  }
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(workLog.status)} variant="secondary">
                    {workLog.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workLog)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workLog)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredWorkLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No work logs found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first work log to get started.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};