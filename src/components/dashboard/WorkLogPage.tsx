import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Download, Clock, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkLog {
  id: string;
  date: string;
  description: string;
  hours_consumed: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface Client {
  id: string;
  project_name: string | null;
  hours_consumed: number;
  total_hours: number;
  amc_start_date: string | null;
  amc_end_date: string | null;
}

interface WorkLogFormData {
  date: string;
  description: string;
  hours_consumed: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export const WorkLogPage = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [formData, setFormData] = useState<WorkLogFormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    hours_consumed: 0,
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  useEffect(() => {
    if (projectSlug) {
      fetchClient();
      fetchWorkLogs();
    }
  }, [projectSlug]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, project_name, hours_consumed, total_hours, amc_start_date, amc_end_date')
        .eq('project_slug', projectSlug)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive",
      });
    }
  };

  const fetchWorkLogs = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('project_slug', projectSlug)
        .single();

      if (clientError) throw clientError;

      const { data, error } = await supabase
        .from('work_logs')
        .select('*')
        .eq('client_id', clientData.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;

    try {
      if (editingLog) {
        const { error } = await supabase
          .from('work_logs')
          .update(formData)
          .eq('id', editingLog.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('work_logs')
          .insert([{
            ...formData,
            client_id: client.id,
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Work log created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchWorkLogs();
      fetchClient(); // Refresh client data for updated hours
    } catch (error) {
      console.error('Error saving work log:', error);
      toast({
        title: "Error",
        description: "Failed to save work log",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (workLog: WorkLog) => {
    setEditingLog(workLog);
    setFormData({
      date: workLog.date,
      description: workLog.description,
      hours_consumed: workLog.hours_consumed,
      start_date: workLog.start_date || '',
      end_date: workLog.end_date || '',
      status: workLog.status as 'pending' | 'in_progress' | 'completed',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;

    try {
      const { error } = await supabase
        .from('work_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Work log deleted successfully",
      });
      
      fetchWorkLogs();
      fetchClient(); // Refresh client data for updated hours
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
    setEditingLog(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      hours_consumed: 0,
      start_date: '',
      end_date: '',
      status: 'pending' as const,
    });
  };

  const exportCSV = () => {
    if (workLogs.length === 0) {
      toast({
        title: "No Data",
        description: "No work logs to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date', 'Description', 'Hours Consumed', 'Start Date', 'End Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...workLogs.map(log => [
        log.date,
        `"${log.description}"`,
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
    a.download = `${projectSlug}-work-logs.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const hoursRemaining = client.total_hours - client.hours_consumed;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client Management
            </Button>
            <h1 className="text-3xl font-bold">{client.project_name} - Work Logs</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportCSV}>
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
            </Dialog>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hours Consumed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{client.hours_consumed}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hours Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{hoursRemaining}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AMC Start Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {client.amc_start_date ? new Date(client.amc_start_date).toLocaleDateString() : 'Not set'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AMC End Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {client.amc_end_date ? new Date(client.amc_end_date).toLocaleDateString() : 'Not set'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Work Description</TableHead>
                  <TableHead>Hours Consumed</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                    <TableCell>{log.hours_consumed}h</TableCell>
                    <TableCell>
                      {log.start_date ? new Date(log.start_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {log.end_date ? new Date(log.end_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(log)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {workLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No work logs found. Add your first work log to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Work Log Dialog */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLog ? 'Edit Work Log' : 'Add New Work Log'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="col-span-2">
                <Label htmlFor="description">Work Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLog ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </div>
    </div>
  );
};