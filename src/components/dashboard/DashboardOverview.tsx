import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Clock, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GlobalStats {
  totalCostPaid: number;
  hoursConsumed: number;
  hoursRemaining: number;
}

interface ExpiringClient {
  id: string;
  project_name: string;
  client_poc_name: string;
  client_poc_contact_number: string;
  poc_email: string;
  hoursRemaining: number;
  amcExpiryDate: string;
  paymentTerm: string;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalCostPaid: 0,
    hoursConsumed: 0,
    hoursRemaining: 0,
  });
  const [expiringClients, setExpiringClients] = useState<ExpiringClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
    fetchExpiringClients();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      // Fetch clients and their work logs to calculate consumed hours
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, cost_for_year, payment_term');

      if (clientsError) throw clientsError;

      const { data: workLogs, error: workLogsError } = await supabase
        .from('work_logs')
        .select('client_id, hours_consumed');

      if (workLogsError) throw workLogsError;

      // Calculate totals
      const totalCostPaid = clients?.reduce((sum, client) => sum + (client.cost_for_year || 0), 0) || 0;
      const hoursConsumed = workLogs?.reduce((sum, log) => sum + (Number(log.hours_consumed) || 0), 0) || 0;
      
      // Calculate allocated hours based on payment term
      const totalAllocatedHours = clients?.reduce((sum, client) => {
        const yearlyHours = 2000; // Base yearly hours
        let allocatedHours = yearlyHours;
        
        switch (client.payment_term) {
          case 'monthly':
            allocatedHours = yearlyHours / 12;
            break;
          case 'quarterly':
            allocatedHours = yearlyHours / 4;
            break;
          case 'half_yearly':
            allocatedHours = yearlyHours / 2;
            break;
          case 'yearly':
            allocatedHours = yearlyHours;
            break;
        }
        
        return sum + allocatedHours;
      }, 0) || 0;

      const hoursRemaining = totalAllocatedHours - hoursConsumed;

      setStats({
        totalCostPaid,
        hoursConsumed,
        hoursRemaining,
      });
    } catch (error) {
      console.error('Error fetching global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringClients = async () => {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, project_name, client_poc_name, client_poc_contact_number, poc_email, payment_term, amc_end_date');

      if (clientsError) throw clientsError;

      const { data: workLogs, error: workLogsError } = await supabase
        .from('work_logs')
        .select('client_id, hours_consumed');

      if (workLogsError) throw workLogsError;

      const now = new Date();
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const expiring = clients?.filter(client => {
        // Check AMC expiry date
        const amcEndDate = client.amc_end_date ? new Date(client.amc_end_date) : null;
        const isAmcExpiring = amcEndDate && amcEndDate <= sixtyDaysFromNow;

        // Calculate hours remaining for this client
        const clientWorkLogs = workLogs?.filter(log => log.client_id === client.id) || [];
        const clientHoursConsumed = clientWorkLogs.reduce((sum, log) => sum + (Number(log.hours_consumed) || 0), 0);
        
        const yearlyHours = 2000;
        let allocatedHours = yearlyHours;
        
        switch (client.payment_term) {
          case 'monthly':
            allocatedHours = yearlyHours / 12;
            break;
          case 'quarterly':
            allocatedHours = yearlyHours / 4;
            break;
          case 'half_yearly':
            allocatedHours = yearlyHours / 2;
            break;
          case 'yearly':
            allocatedHours = yearlyHours;
            break;
        }
        
        const hoursRemaining = allocatedHours - clientHoursConsumed;
        const isHoursLow = hoursRemaining < (allocatedHours * 0.1); // Less than 10%

        return isAmcExpiring || isHoursLow;
      }).map(client => {
        const clientWorkLogs = workLogs?.filter(log => log.client_id === client.id) || [];
        const clientHoursConsumed = clientWorkLogs.reduce((sum, log) => sum + (Number(log.hours_consumed) || 0), 0);
        
        const yearlyHours = 2000;
        let allocatedHours = yearlyHours;
        
        switch (client.payment_term) {
          case 'monthly':
            allocatedHours = yearlyHours / 12;
            break;
          case 'quarterly':
            allocatedHours = yearlyHours / 4;
            break;
          case 'half_yearly':
            allocatedHours = yearlyHours / 2;
            break;
          case 'yearly':
            allocatedHours = yearlyHours;
            break;
        }
        
        const hoursRemaining = allocatedHours - clientHoursConsumed;

        return {
          id: client.id,
          project_name: client.project_name || '',
          client_poc_name: client.client_poc_name || '',
          client_poc_contact_number: client.client_poc_contact_number || '',
          poc_email: client.poc_email || '',
          hoursRemaining,
          amcExpiryDate: client.amc_end_date || '',
          paymentTerm: client.payment_term || '',
        };
      }) || [];

      setExpiringClients(expiring);
    } catch (error) {
      console.error('Error fetching expiring clients:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCostPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all active clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Consumed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursConsumed}h</div>
            <p className="text-xs text-muted-foreground">
              Total hours worked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Remaining</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursRemaining}h</div>
            <p className="text-xs text-muted-foreground">
              Available across all clients
            </p>
          </CardContent>
        </Card>
      </div>

      {expiringClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              AMC Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client POC</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hours Remaining</TableHead>
                  <TableHead>AMC Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.project_name}</TableCell>
                    <TableCell>{client.client_poc_name}</TableCell>
                    <TableCell>{client.client_poc_contact_number}</TableCell>
                    <TableCell>{client.poc_email}</TableCell>
                    <TableCell>{Math.round(client.hoursRemaining)}h</TableCell>
                    <TableCell>
                      {client.amcExpiryDate ? new Date(client.amcExpiryDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};