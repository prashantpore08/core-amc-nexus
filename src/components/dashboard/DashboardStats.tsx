import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CalendarDays, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  totalCostPaid: number;
  hoursConsumed: number;
  hoursRemaining: number;
  totalClients: number;
  amcStartDate: string | null;
  amcEndDate: string | null;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalCostPaid: 0,
    hoursConsumed: 0,
    hoursRemaining: 0,
    totalClients: 0,
    amcStartDate: null,
    amcEndDate: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('total_hours, hours_consumed, amc_start_date, amc_end_date');

      if (error) throw error;

      if (clients) {
        const totalHours = clients.reduce((sum, client) => sum + (client.total_hours || 0), 0);
        const consumedHours = clients.reduce((sum, client) => sum + (client.hours_consumed || 0), 0);
        
        // Calculate cost assuming $50 per hour (this can be made configurable)
        const costPerHour = 50;
        const totalCost = consumedHours * costPerHour;

        // Get earliest start date and latest end date
        const startDates = clients.map(c => c.amc_start_date).filter(Boolean);
        const endDates = clients.map(c => c.amc_end_date).filter(Boolean);

        setStats({
          totalCostPaid: totalCost,
          hoursConsumed: consumedHours,
          hoursRemaining: totalHours - consumedHours,
          totalClients: clients.length,
          amcStartDate: startDates.length > 0 ? Math.min(...startDates.map(d => new Date(d!).getTime())).toString() : null,
          amcEndDate: endDates.length > 0 ? Math.max(...endDates.map(d => new Date(d!).getTime())).toString() : null,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(parseInt(dateString)).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost Paid</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalCostPaid.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Based on consumed hours
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
            Across all projects
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Remaining</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.hoursRemaining}h</div>
          <p className="text-xs text-muted-foreground">
            Available for work
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            Active projects
          </p>
        </CardContent>
      </Card>

      {(stats.amcStartDate || stats.amcEndDate) && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              AMC Period Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-lg">{formatDate(stats.amcStartDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-lg">{formatDate(stats.amcEndDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};