import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HourRequest {
  id: string;
  client_id: string;
  requested_hours: number;
  status: string;
  created_at: string;
  clients: {
    project_name: string;
    payment_term: string;
  };
}

export const HourRequests = () => {
  const [hourRequests, setHourRequests] = useState<HourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHourRequests();
  }, []);

  const fetchHourRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('hour_requests')
        .select(`
          *,
          clients(project_name, payment_term)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHourRequests(data || []);
    } catch (error) {
      console.error('Error fetching hour requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hour requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: HourRequest) => {
    try {
      // Update request status
      const { error: requestError } = await supabase
        .from('hour_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Note: Client hours are now managed through work logs
      // This approval just changes the request status

      toast({
        title: "Success",
        description: `Approved ${request.requested_hours} hours for ${request.clients.project_name}`,
      });

      fetchHourRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve hour request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (request: HourRequest) => {
    try {
      const { error } = await supabase
        .from('hour_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Rejected hour request for ${request.clients.project_name}`,
      });

      fetchHourRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject hour request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hour Extension Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Requested Hours</TableHead>
              <TableHead>Payment Term</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hourRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.clients.project_name}
                </TableCell>
                <TableCell>{request.requested_hours}h</TableCell>
                <TableCell>{request.clients.payment_term}</TableCell>
                <TableCell>
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.status)} variant="secondary">
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(request)}
                        className="text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request)}
                        className="text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {request.status !== 'pending' && (
                    <span className="text-muted-foreground text-sm">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hourRequests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hour requests found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};