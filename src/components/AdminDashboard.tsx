import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import SampleDataInitializerTemp from '@/components/SampleDataInitializerTemp';
import { initializeSampleProducts, setupAdminUser } from '@/utils/init-database';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { products } from '@/lib/products';
import { Users, Package, CreditCard, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingCreditRequests: number;
  totalRevenue: number;
  activeUsers: number;
}

interface RecentActivity {
  id: number;
  action_type: string;
  target_type: string;
  target_id: string;
  notes: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch statistics from Supabase
        const [usersRes, productsRes, ordersRes, creditsRes] = await Promise.all([
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        // Calculate total revenue from completed orders
        const { data: completedOrders } = await supabase
          .from('orders')
          .select('total_price')
          .eq('status', 'completed');

        const totalRevenue = completedOrders?.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0) || 0;

        // Count active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: activeUsersCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', thirtyDaysAgo.toISOString());

        setStats({
          totalUsers: usersRes.count || 0,
          totalProducts: productsRes.count || 0,
          pendingOrders: ordersRes.count || 0,
          pendingCreditRequests: creditsRes.count || 0,
          totalRevenue,
          activeUsers: activeUsersCount || 0
        });

        // Fetch recent activities
        const { data: activities, error: activitiesError } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (activitiesError) throw new Error(activitiesError.message);

        setRecentActivities(activities || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>);

  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 flex items-center justify-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats?.activeUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{stats?.totalRevenue || 0} MMK</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Credit Requests</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats?.pendingCreditRequests || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="glass-card border-white/10 bg-transparent">
        <CardHeader>
          <CardTitle className="text-white">Recent Admin Activities</CardTitle>
          <CardDescription className="text-white/70">Latest administrative actions performed</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ?
          <p className="text-center text-white/60 py-8">No recent activities found</p> :

          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Action</TableHead>
                    <TableHead className="text-white">Target</TableHead>
                    <TableHead className="text-white">Notes</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) =>
                <TableRow key={activity.id} className="border-white/10">
                      <TableCell>
                        <Badge variant="outline" className="border-amber-400/30 text-amber-400">{activity.action_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white/80">
                          {activity.target_type} #{activity.target_id}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-white/70">
                        {activity.notes || 'No notes'}
                      </TableCell>
                      <TableCell className="text-sm text-white/50">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Button
          onClick={async () => {
            try {
              const { error } = await supabase.from('products').upsert(products.map(p => ({
                ...p,
                is_active: true,
                stock_quantity: 100
              })));
              if (error) throw error;
              toast({ title: "Success", description: "Sample products initialized" });
            } catch (error) {
              toast({ title: "Error", description: "Failed to initialize products", variant: "destructive" });
            }
          }}
          className="h-20 text-left flex flex-col items-start justify-center bg-blue-600 hover:bg-blue-700">
          <span className="font-semibold">Initialize Sample Products</span>
          <span className="text-sm text-blue-100">Add sample telecom products to the database</span>
        </Button>
        <Button
          onClick={async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('No user found');
              
              const { error } = await supabase.from('user_profiles').upsert({
                user_id: user.id,
                email: user.email || 'thewayofthedragg@gmail.com',
                full_name: user.user_metadata?.full_name || 'Admin User'
              });
              if (error) throw error;
              toast({ title: "Success", description: "Admin account configured" });
            } catch (error) {
              toast({ title: "Error", description: "Failed to setup admin", variant: "destructive" });
            }
          }}
          className="h-20 text-left flex flex-col items-start justify-center bg-green-600 hover:bg-green-700">
          <span className="font-semibold">Setup Admin Account</span>
          <span className="text-sm text-green-100">Configure current user as admin</span>
        </Button>
      </div>

      {/* Sample Data Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Database Management</h2>
        <SampleDataInitializerTemp />
      </div>
    </div>);

}