import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import {
  Users, DollarSign, MessageSquare,
  Shield, Crown, User, RefreshCw, Loader2, FileSearch, Upload
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'user';
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    totalAnalyses: 0
  });

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers();
      fetchStats();
    }
  }, [profile]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, display_name, role, usage_limit, usage_count, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get pro users (usage_limit is null)
      const { count: proUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .is('usage_limit', null);

      // Get total analyses
      const { count: totalAnalyses } = await supabase
        .from('fraud_analyses')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        totalAnalyses: totalAnalyses || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const toggleProStatus = async (user: UserData) => {
    setUpdatingUserId(user.id);
    try {
      const newLimit = user.usage_limit === null ? 1 : null; // Toggle between PRO (null) and FREE (1)

      const { error } = await supabase
        .from('user_profiles')
        .update({ usage_limit: newLimit })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, usage_limit: newLimit } : u
      ));

      toast({
        title: 'Success',
        description: `User ${user.email} is now ${newLimit === null ? 'PRO' : 'FREE'}`,
        className: 'bg-green-50 border-green-200'
      });

      fetchStats(); // Refresh stats
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const resetUsageCount = async (user: UserData) => {
    setUpdatingUserId(user.id);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ usage_count: 0 })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, usage_count: 0 } : u
      ));

      toast({
        title: 'Success',
        description: `Usage count reset for ${user.email}`,
        className: 'bg-green-50 border-green-200'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to reset usage count',
        variant: 'destructive'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleAdminRole = async (user: UserData) => {
    setUpdatingUserId(user.id);
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Success',
        description: `User ${user.email} role changed to ${newRole}`,
        className: 'bg-green-50 border-green-200'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

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
              value={stats.totalUsers}
              icon={Users}
            />
            <MetricCard
              label="Pro Users"
              value={stats.proUsers}
              icon={Crown}
            />
            <MetricCard
              label="Total Analyses"
              value={stats.totalAnalyses}
              icon={MessageSquare}
            />
            <MetricCard
              label="Revenue (Est.)"
              value={stats.proUsers * 299000}
              prefix="IDR "
              icon={DollarSign}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="fraudcheck">FraudCheck</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
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
                      <span className="font-semibold">{stats.proUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Conversion Rate</span>
                      <span className="font-semibold">
                        {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Avg. Analyses/User</span>
                      <span className="font-semibold">
                        {stats.totalUsers > 0 ? (stats.totalAnalyses / stats.totalUsers).toFixed(1) : 0}
                      </span>
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
                        <span className="text-sm">Payment Gateway</span>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage user accounts, subscriptions, and roles</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                  {user.role === 'admin' ? (
                                    <Shield className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <User className="w-4 h-4 text-slate-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{user.display_name || 'No Name'}</p>
                                  <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className={user.role === 'admin' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                              >
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.usage_limit === null}
                                  onCheckedChange={() => toggleProStatus(user)}
                                  disabled={updatingUserId === user.id}
                                />
                                <Badge
                                  variant={user.usage_limit === null ? 'default' : 'outline'}
                                  className={user.usage_limit === null ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                                >
                                  {user.usage_limit === null ? (
                                    <><Crown className="w-3 h-3 mr-1" />PRO</>
                                  ) : 'FREE'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {user.usage_count} / {user.usage_limit === null ? '∞' : user.usage_limit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resetUsageCount(user)}
                                  disabled={updatingUserId === user.id || user.usage_count === 0}
                                >
                                  Reset Usage
                                </Button>
                                <Button
                                  variant={user.role === 'admin' ? 'destructive' : 'outline'}
                                  size="sm"
                                  onClick={() => toggleAdminRole(user)}
                                  disabled={updatingUserId === user.id || user.id === profile?.id}
                                >
                                  {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fraudcheck">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => navigate('/upload-ocr')}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle>New Analysis</CardTitle>
                        <CardDescription>Upload a financial document for fraud detection</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload PDF, Word, or Excel documents and let AI extract financial data automatically.
                    </p>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Start New Analysis
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate('/history')}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle>Analysis History</CardTitle>
                        <CardDescription>View all previous fraud analyses</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Review past analyses, compare results, and track fraud detection patterns.
                    </p>
                    <Button variant="outline" className="w-full">
                      <FileSearch className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Admin Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    As an admin, you have <span className="font-semibold text-emerald-600">unlimited access</span> to fraud analysis features without subscription limits.
                  </p>
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

