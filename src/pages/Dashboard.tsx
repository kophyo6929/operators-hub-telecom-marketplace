import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Smartphone, 
  Package, 
  HelpCircle, 
  Plus, 
  Minus, 
  RotateCcw,
  Eye,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface UserProfile {
  full_name: string;
  email: string;
  credits_balance: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  credit_amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
}

interface Order {
  id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  credits_used: number;
  status: string;
  created_at: string;
  phone_number?: string;
  operator?: string;
  products?: {
    name: string;
    operator: string;
    category: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      await fetchUserData(user.id);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch recent orders with product details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            name,
            operator,
            category
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getOperatorColor = (operator: string) => {
    switch (operator) {
      case 'MPT': return 'bg-blue-500';
      case 'OOREDOO': return 'bg-red-500';
      case 'ATOM': return 'bg-red-600';
      case 'MYTEL': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const reorderProduct = async (order: Order) => {
    if (!order.products) return;
    
    toast.success(`Added ${order.products.name} to cart`);
    // You can implement actual cart functionality here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {profile?.full_name || 'User'}!
            </h1>
            <p className="text-muted-foreground">Welcome back to your Teleshop Myanmar dashboard</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{currentDate}</p>
            <p>{currentTime}</p>
          </div>
        </div>

        {/* Credit Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm opacity-90">Credit Balance</span>
                </div>
                <p className="text-3xl font-bold">{profile?.credits_balance?.toLocaleString() || '0'}</p>
                <p className="text-sm opacity-90">Credits</p>
                <p className="text-xs opacity-75 mt-2">Available for purchases</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/premium')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buy Credit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              navigate('/browse?scrollTo=products');
            }}>
              <CardContent className="p-4 text-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg w-fit mx-auto mb-3">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium">All Products</h3>
                <p className="text-sm text-muted-foreground">Browse all products</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/profile')}>
              <CardContent className="p-4 text-center">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg w-fit mx-auto mb-3">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium">My Orders</h3>
                <p className="text-sm text-muted-foreground">Track your orders</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/premium')}>
              <CardContent className="p-4 text-center">
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg w-fit mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-medium">Buy Credit</h3>
                <p className="text-sm text-muted-foreground">Top up your balance</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/faq')}>
              <CardContent className="p-4 text-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg w-fit mx-auto mb-3">
                  <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-muted-foreground">Get help & FAQ</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Favorite Operators */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Favorite Operators</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['MPT', 'ATOM', 'MYTEL', 'OOREDOO'].map((operator) => (
              <Card 
                key={operator} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/browse?operator=${operator}&scrollTo=products`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getOperatorColor(operator)}`}>
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{operator}</h3>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 4) + 1} {Math.random() > 0.5 ? 'days' : 'weeks'} ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {transactions.length > 0 ? (
                  <div className="space-y-0">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.transaction_type === 'purchase' || transaction.transaction_type === 'debit' 
                                ? 'bg-red-100 dark:bg-red-900' 
                                : 'bg-green-100 dark:bg-green-900'
                            }`}>
                              {transaction.transaction_type === 'purchase' || transaction.transaction_type === 'debit' ? (
                                <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
                              ) : (
                                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {transaction.transaction_type === 'purchase' || transaction.transaction_type === 'debit' 
                                  ? 'Product Purchase' 
                                  : `Credit Top-up via ${transaction.payment_method || 'Payment'}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.created_at)} • {transaction.payment_method || 'Credit Balance'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.transaction_type === 'purchase' || transaction.transaction_type === 'debit' 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {transaction.transaction_type === 'purchase' || transaction.transaction_type === 'debit' ? '-' : '+'}
                              {transaction.credit_amount.toLocaleString()} Credits
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status === 'completed' ? 'Completed' : transaction.status}
                            </Badge>
                          </div>
                        </div>
                        {index < transactions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                View All Orders
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {orders.length > 0 ? (
                  <div className="space-y-0">
                    {orders.map((order, index) => (
                      <div key={order.id}>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getOperatorColor(order.operator || 'default')}`}>
                              <Smartphone className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">#{order.id}</p>
                              <p className="text-sm">{order.products?.name || 'Product'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{order.credits_used.toLocaleString()} Credits</p>
                            <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                              {order.status === 'completed' ? 'Completed' : order.status}
                            </Badge>
                            {order.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-2 h-6 px-2"
                                onClick={() => reorderProduct(order)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                        {index < orders.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Reorder Section */}
        {orders.filter(order => order.status === 'completed').length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Quick Reorder</h2>
              <Button variant="ghost" size="sm">View Purchase History</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {orders.filter(order => order.status === 'completed').slice(0, 4).map((order) => (
                <Card key={`reorder-${order.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getOperatorColor(order.operator || 'default')}`}>
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{order.products?.name || 'Product'}</h3>
                          <p className="text-sm text-muted-foreground">{order.operator}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.credits_used} Credits</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Data:</span>
                        <span>5GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Validity:</span>
                        <span>30 days</span>
                      </div>
                      {order.products?.category === 'Packages' && (
                        <div className="flex justify-between text-sm">
                          <span>Bonus:</span>
                          <span className="text-green-600">Free Facebook</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => reorderProduct(order)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        <span>Purchased {Math.floor(Math.random() * 10) + 1} times</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Frequent
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;