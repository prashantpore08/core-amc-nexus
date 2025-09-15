import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, DollarSign, Clock, Calendar, FileDown, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatRupees, calculateHoursAllocation } from '@/lib/utils';

interface WorkLog {
  id: string;
  client_id: string;
  date: string;
  work_description: string;
  hours_consumed: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface WorkLogFormData {
  date: string;
  work_description: string;
  hours_consumed: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ClientStats {
  hoursConsumed: number;
  hoursRemaining: number;
  amcStartDate: string | null;
  amcEndDate: string | null;
  paymentDone: number;
  remainingPayment: number;
}

export const WorkLogPage = () => {
  const { projectSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<any>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats>({
    hoursConsumed: 0,
    hoursRemaining: 0,
    amcStartDate: null,
    amcEndDate: null,
    paymentDone: 0,
    remainingPayment: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [formData, setFormData] = useState<WorkLogFormData>({
    date: '',
    work_description: '',
    hours_consumed: 0,
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  useEffect(() => {
    if (projectSlug) {
      fetchClient();
    }
  }, [projectSlug]);

  useEffect(() => {
    if (client?.id) {
      fetchWorkLogs();
      fetchClientStats();
    }
  }, [client?.id]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
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
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLogs = async () => {
    if (!client?.id) return;

    try {
      const { data, error } = await supabase
        .from('work_logs')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkLogs(data || []);
    } catch (error) {
      console.error('Error fetching work logs:', error);
    }
  };

  const fetchClientStats = async () => {
    if (!client?.id) return;

    try {
      // Fetch work logs to calculate consumed hours
      const { data: workLogsData, error: workLogsError } = await supabase
        .from('work_logs')
        .select('hours_consumed')
        .eq('client_id', client.id);

      if (workLogsError) throw workLogsError;

      // Fetch payments to calculate payment stats
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, amount_remaining')
        .eq('client_id', client.id);

      if (paymentsError && paymentsError.code !== 'PGRST116') throw paymentsError;

      const hoursConsumed = workLogsData?.reduce((sum, log) => sum + (Number(log.hours_consumed) || 0), 0) || 0;
      
      // Calculate allocated hours based on payment term and hours_assigned_year
      const hoursAssignedYear = (client as any).hours_assigned_year || 2000; // Default to 2000 if not set
      const hoursAllocation = calculateHoursAllocation(hoursAssignedYear, client.payment_term);
      
      let allocatedHours = hoursAssignedYear;
      
      switch (client.payment_term) {
        case 'Monthly':
          allocatedHours = hoursAllocation.breakdown.perMonth;
          break;
        case 'Quarterly':
          allocatedHours = hoursAllocation.breakdown.perQuarter;
          break;
        case 'Half-Yearly':
          allocatedHours = hoursAllocation.breakdown.perHalfYear;
          break;
        case 'Yearly':
          allocatedHours = hoursAllocation.breakdown.perYear;
          break;
      }

      const hoursRemaining = allocatedHours - hoursConsumed;
      const paymentDone = paymentsData?.reduce((sum, payment) => sum + (Number(payment.amount_paid) || 0), 0) || 0;
      const remainingPayment = (client.cost_for_year || 0) - paymentDone;

      setClientStats({
        hoursConsumed,
        hoursRemaining,
        amcStartDate: client.amc_start_date,
        amcEndDate: client.amc_end_date,
        paymentDone,
        remainingPayment,
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
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
        
        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('work_logs')
          .insert([{ ...formData, client_id: client.id }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Work log created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchWorkLogs();
      fetchClientStats();
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
    setEditingWorkLog(workLog);
    setFormData({
      date: workLog.date,
      work_description: workLog.work_description,
      hours_consumed: Number(workLog.hours_consumed),
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
      fetchClientStats();
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
      date: '',
      work_description: '',
      hours_consumed: 0,
      start_date: '',
      end_date: '',
      status: 'pending',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Work Description', 'Hours Consumed', 'Start Date', 'End Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...workLogs.map(log => [
        log.date,
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
    a.download = `${client?.project_name || 'client'}-work-logs.csv`;
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
        <Button onClick={() => navigate('/dashboard/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/clients')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Work Log - {client?.project_name}
          </h1>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Consumed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientStats.hoursConsumed.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {client?.cost_for_year ? `${((clientStats.hoursConsumed / (client.cost_for_year / 100)) * 100).toFixed(1)}% of total` : 'No limit set'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Remaining</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientStats.hoursRemaining.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {client?.cost_for_year ? `${((clientStats.hoursRemaining / (client.cost_for_year / 100)) * 100).toFixed(1)}% remaining` : 'No limit set'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Done</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupees(clientStats.paymentDone)}</div>
              <p className="text-xs text-muted-foreground">
                {client?.cost_for_year ? `${((clientStats.paymentDone / client.cost_for_year) * 100).toFixed(1)}% of total` : 'No cost set'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AMC Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {client?.amc_start_date && client?.amc_end_date 
                  ? `${new Date(client.amc_start_date).toLocaleDateString()} - ${new Date(client.amc_end_date).toLocaleDateString()}`
                  : 'Not set'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Remaining: {formatRupees(clientStats.remainingPayment)}
              </p>
            </CardContent>
          </Card>
        </div>

      {clientStats.amcStartDate && clientStats.amcEndDate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              AMC Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-lg">{new Date(clientStats.amcStartDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-lg">{new Date(clientStats.amcEndDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Work Logs</h2>
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
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                      setFormData({...formData, status: value})
                    }
                  >
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
                <div className="col-span-2">
                  <Label htmlFor="work_description">Work Description *</Label>
                  <Textarea
                    id="work_description"
                    value={formData.work_description}
                    onChange={(e) => setFormData({...formData, work_description: e.target.value})}
                    required
                  />
                </div>
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

      <Card>
        <CardContent className="p-0">
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
              {workLogs.map((workLog) => (
                <TableRow key={workLog.id}>
                  <TableCell>{new Date(workLog.date).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{workLog.work_description}</TableCell>
                  <TableCell>{workLog.hours_consumed}h</TableCell>
                  <TableCell>
                    {workLog.start_date ? new Date(workLog.start_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {workLog.end_date ? new Date(workLog.end_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize px-2 py-1 rounded text-xs ${
                      workLog.status === 'approved' ? 'bg-green-100 text-green-800' :
                      workLog.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {workLog.status}
                    </span>
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
                        onClick={() => handleDelete(workLog.id)}
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
    </div>
  );
};