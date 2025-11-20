import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, DollarSign, MessageSquare, TrendingUp,
  Settings, BarChart3, Shield
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-navy">FraudCheck Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{profile?.display_name || profile?.email}</span>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">User View</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your application, users, and settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Users"
            value={0}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            label="Revenue (MRR)"
            value={0}
            prefix="$"
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            label="Total Analyses"
            value={0}
            icon={BarChart3}
            trend={{ value: 23, isPositive: true }}
          />
          <MetricCard
            label="Pending Reviews"
            value={0}
            icon={MessageSquare}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest user actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600">
                    No recent activity to display.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Active Subscriptions</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Conversion Rate</span>
                    <span className="font-semibold">0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Avg. Analyses/User</span>
                    <span className="font-semibold">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Monitor system performance and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Database</span>
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Authentication</span>
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">API</span>
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  User management interface coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Discounts</CardTitle>
                <CardDescription>Manage pricing plans and promotional discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  Pricing management interface coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonial Management</CardTitle>
                <CardDescription>Review and approve user testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  Testimonial management interface coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure application settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  Settings interface coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
