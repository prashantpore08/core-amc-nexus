import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart3, Building2, Users, Clock } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
  { id: 'clients', label: 'Client Management', icon: Building2 },
  { id: 'admins', label: 'Admin Management', icon: Users },
  { id: 'requests', label: 'Hour Requests', icon: Clock },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-card border-r border-border h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">AMC Portal</h1>
        </div>
        
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === tab.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};