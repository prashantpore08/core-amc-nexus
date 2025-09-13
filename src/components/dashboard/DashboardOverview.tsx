import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  project_name: string;
  client_poc_name: string;
  client_poc_contact_number: string;
  poc_email: string;
  amc_end_date: string;
  cost_for_year: number;
  payment_term: string;
  ting_poc_primary: {
    name: string;
  } | null;
  ting_poc_secondary: {
    name: string;
  } | null;
  work_logs: {
    hours_consumed: number;
  }[];
}

interface DashboardStats {
  totalCostPaid: number;
  totalPaymentThisMonth: number;
  expiringClients: Client[];
}

const calculateHoursFromPaymentTerm = (costForYear: number, paymentTerm: string): number => {
  const baseHours = costForYear / 100; // Assuming $100 per hour base rate
  
  switch (paymentTerm) {
    case 'monthly':
      return baseHours / 12;
    case 'quarterly':
      return baseHours / 4;
    case 'half_yearly':
      return baseHours / 2;
    case 'yearly':
      return baseHours;
    default:
      return baseHours;
  }
};

const calculateHoursRemaining = (totalHours: number, consumedHours: number): number => {
  return Math.max(0, totalHours - consumedHours);
};

const isExpiringClient = (client: Client, consumedHours: number): boolean => {
  const amcEndDate = new Date(client.amc_end_date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((amcEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if AMC expires within 60 days
  if (daysUntilExpiry <= 60 && daysUntilExpiry >= 0) {
    return true;
  }
  
  // Check if hours remaining is less than 10%
  const totalHours = calculateHoursFromPaymentTerm(client.cost_for_year, client.payment_term);
  const hoursRemaining = calculateHoursRemaining(totalHours, consumedHours);
  const tenPercentHours = totalHours * 0.1;
  
  return hoursRemaining < tenPercentHours;
};

export const DashboardOverview = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCostPaid: 0,
    totalPaymentThisMonth: 0,
    expiringClients: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments for total cost paid
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, payment_date');
      
      if (paymentsError) throw paymentsError;
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentMonthYear = new Date().getFullYear();
      
      const totalCostPaid = paymentsData
        ?.filter(payment => new Date(payment.payment_date).getFullYear() === currentYear)
        .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      
      const totalPaymentThisMonth = paymentsData
        ?.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentMonthYear;
        })
        .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      
      // Fetch clients with POC details and work logs for expiring clients calculation
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          project_name,
          client_poc_name,
          client_poc_contact_number,
          poc_email,
          amc_end_date,
          cost_for_year,
          payment_term,
          ting_poc_primary:admins!clients_ting_poc_primary_fkey(name),
          ting_poc_secondary:admins!clients_ting_poc_secondary_fkey(name),
          work_logs(hours_consumed)
        `);
      
      if (clientsError) throw clientsError;
      
      // Filter expiring clients
      const expiringClients = clientsData?.filter(client => {
        const consumedHours = client.work_logs?.reduce((sum, log) => sum + (log.hours_consumed || 0), 0) || 0;
        return isExpiringClient(client, consumedHours);
      }) || [];
      
      setStats({
        totalCostPaid,
        totalPaymentThisMonth,
        expiringClients
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Paid (Current Year)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCostPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All client payments in {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPaymentThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Payments received in {new Date().toLocaleDateString('en-US', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.expiringClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              AMC Expiring Soon ({stats.expiringClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client POC</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hours Remaining</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Ting POC(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.expiringClients.map((client) => {
                  const consumedHours = client.work_logs?.reduce((sum, log) => sum + (log.hours_consumed || 0), 0) || 0;
                  const totalHours = calculateHoursFromPaymentTerm(client.cost_for_year, client.payment_term);
                  const hoursRemaining = calculateHoursRemaining(totalHours, consumedHours);
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.project_name}</TableCell>
                      <TableCell>{client.client_poc_name}</TableCell>
                      <TableCell>{client.client_poc_contact_number}</TableCell>
                      <TableCell>{client.poc_email}</TableCell>
                      <TableCell>{hoursRemaining.toFixed(1)}h</TableCell>
                      <TableCell>{new Date(client.amc_end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {client.ting_poc_primary && (
                            <span className="text-red-600 font-medium">
                              Primary: {client.ting_poc_primary.name}
                            </span>
                          )}
                          {client.ting_poc_secondary && (
                            <span className="text-blue-600 font-medium">
                              Secondary: {client.ting_poc_secondary.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {stats.expiringClients.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              All Good!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No clients have AMC expiring within the next 60 days or low hours remaining.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};