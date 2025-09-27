import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { CreditCard, Package, TrendingUp, Calendar, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  credits_balance: number;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  total_price: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  operator: string;
  phone_number: string;
  created_at: string;
  processed_at: string;
}

interface OrderStats {
  total_orders: number;
  successful_orders: number;
  pending_orders: number;
  total_spent: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/auth');
        return;
      }
      await loadProfileData();
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/auth');
    }
  };

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error('Failed to load profile');
        }

          // If no profile exists, create one
          if (!userProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            credits_balance: 15000, // Default balance for demo
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw new Error('Failed to create profile');
        setProfile(newProfile);
      } else {
        setProfile(userProfile);
      }

      // Get user orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw new Error('Failed to load orders');

      // Get user payment requests
      const { data: paymentRequestsData, error: paymentRequestsError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentRequestsError) throw new Error('Failed to load payment requests');

      // Map the data to ensure correct types
      const typedOrders: Order[] = (ordersData || []).map(order => ({
        id: Number(order.id),
        user_id: order.user_id,
        product_id: order.product_id,
        quantity: order.quantity || 1,
        total_price: order.total_price,
        currency: order.currency || 'MMK',
        status: (order.status as 'completed' | 'pending' | 'failed' | 'cancelled') || 'pending',
        operator: order.operator || '',
        phone_number: order.phone_number || '',
        created_at: order.created_at,
        processed_at: order.processed_at
      }));

      setOrders(typedOrders);

      // Map payment requests to orders-like structure for display
      const paymentRequestOrders: Order[] = (paymentRequestsData || []).map(request => ({
        id: Number(request.id),
        user_id: request.user_id,
        product_id: 0, // Payment requests don't have product_id
        quantity: 1,
        total_price: request.total_cost_mmk,
        currency: 'MMK',
        status: (request.status as 'completed' | 'pending' | 'failed' | 'cancelled') || 'pending',
        operator: 'Credit Purchase',
        phone_number: `${request.credits_requested} credits`,
        created_at: request.created_at,
        processed_at: request.processed_at
      }));

      // Combine orders and payment requests
      const allOrders = [...typedOrders, ...paymentRequestOrders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(allOrders);

      // Calculate order stats (including payment requests)
      const stats: OrderStats = {
        total_orders: allOrders?.length || 0,
        successful_orders: allOrders?.filter((o) => o.status === 'completed').length || 0,
        pending_orders: allOrders?.filter((o) => o.status === 'pending').length || 0,
        total_spent: allOrders
          ?.filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.total_price, 0) || 0
      };

      setOrderStats(stats);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
    toast({
      title: "Data refreshed",
      description: "Your profile data has been updated."
    });
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your account and view your order history
              </p>
            </div>
            <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {((profile?.credits_balance || 0) * 100).toLocaleString()} MMK
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(profile?.credits_balance || 0).toLocaleString()} credits
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.total_orders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orderStats?.successful_orders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderStats?.total_spent?.toLocaleString()} MMK
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {profile?.full_name ? getInitials(profile.full_name) :
                        profile?.email ? getInitials(profile.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">
                        {profile?.full_name || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View and manage your recent orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground">
                        Start shopping to see your orders here.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Operator</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">Order #{order.id}</div>
                                <div className="text-sm text-muted-foreground">
                                  Product ID: {order.product_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.operator}</Badge>
                            </TableCell>
                            <TableCell>
                              {order.total_price.toLocaleString()} {order.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Order Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedOrder && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Order ID</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.id}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Status</label>
                                          <div className="mt-1">
                                            <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                                              {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Product ID</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.product_id}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Operator</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.operator}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Amount</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.total_price.toLocaleString()} {selectedOrder.currency}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Date</label>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(selectedOrder.created_at), 'PPP')}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Phone Number</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.phone_number}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;