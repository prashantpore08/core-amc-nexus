import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Building2, Clock, FileText, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientManagement } from './ClientManagement';
import { AdminManagement } from './AdminManagement';
import { WorkLogManagement } from './WorkLogManagement';
import { HourRequests } from './HourRequests';
import { DashboardStats } from './DashboardStats';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">AMC Management Portal</h1>
          </div>
          <Button variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Management Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admins
              </TabsTrigger>
              <TabsTrigger value="worklogs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Logs
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hour Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-6">
              <ClientManagement />
            </TabsContent>

            <TabsContent value="admins" className="mt-6">
              <AdminManagement />
            </TabsContent>

            <TabsContent value="worklogs" className="mt-6">
              <WorkLogManagement />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <HourRequests />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};