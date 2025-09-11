import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GlobalStats {
  totalCostPaid: number;
  hoursConsumed: number;
  hoursRemaining: number;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalCostPaid: 0,
    hoursConsumed: 0,
    hoursRemaining: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('cost_for_year, hours_consumed, total_hours');

      if (error) throw error;

      const totalCostPaid = clients?.reduce((sum, client) => sum + (client.cost_for_year || 0), 0) || 0;
      const hoursConsumed = clients?.reduce((sum, client) => sum + (client.hours_consumed || 0), 0) || 0;
      const totalHours = clients?.reduce((sum, client) => sum + (client.total_hours || 0), 0) || 0;
      const hoursRemaining = totalHours - hoursConsumed;

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

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost Paid
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.totalCostPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Consumed
            </CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.hoursConsumed}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total hours used
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Remaining
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.hoursRemaining}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available across all clients
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};