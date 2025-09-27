import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  total_price: number;
  credits_used: number;
  currency: string;
  operator: string;
  phone_number: string;
  status: string;
  created_at: string;
  processed_at: string;
  admin_notes: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  credits_balance: number;
  avatar_url: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  operator: string;
  price: number;
  currency: string;
}

export function PendingOrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingDialog, setProcessingDialog] = useState(false);
  const [processingType, setProcessingType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch pending orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      const pendingOrders = ordersData || [];
      setOrders(pendingOrders);

      // Fetch user profiles for all unique user IDs
      const userIds = [...new Set(pendingOrders.map((order) => order.user_id))];
      const profiles: Record<string, UserProfile> = {};

      for (const userId of userIds) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!profileError && profileData) {
            profiles[userId] = profileData;
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for user ${userId}:`, err);
        }
      }

      setUserProfiles(profiles);

      // Fetch products for all unique product IDs
      const productIds = [...new Set(pendingOrders.map((order) => order.product_id).filter(Boolean))];
      const productsMap: Record<number, Product> = {};

      for (const productId of productIds) {
        try {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .maybeSingle();

          if (!productError && productData) {
            productsMap[productId] = productData;
          }
        } catch (err) {
          console.warn(`Failed to fetch product ${productId}:`, err);
        }
      }

      setProducts(productsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending orders');
      console.error('Error fetching pending orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsProcessing(true);

      const isApproved = processingType === 'approve';
      const now = new Date().toISOString();

      // Update the order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: isApproved ? 'completed' : 'rejected',
          processed_at: now,
          admin_notes: adminNotes
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      // If rejected, refund credits to user
      if (!isApproved) {
        const userProfile = userProfiles[selectedOrder.user_id];
        if (userProfile && selectedOrder.credits_used > 0) {
          const newBalance = userProfile.credits_balance + selectedOrder.credits_used;

          const { error: refundError } = await supabase
            .from('user_profiles')
            .update({
              credits_balance: newBalance
            })
            .eq('user_id', selectedOrder.user_id);

          if (refundError) throw refundError;

          // Create a refund transaction record
          const { error: transactionError } = await supabase
            .from('credit_transactions')
            .insert({
              user_id: selectedOrder.user_id,
              transaction_type: 'refund',
              credit_amount: selectedOrder.credits_used,
              currency: selectedOrder.currency || 'MMK',
              status: 'completed',
              payment_method: 'refund',
              payment_reference: `ORDER-REFUND-${selectedOrder.id}`,
              previous_balance: userProfile.credits_balance,
              new_balance: newBalance,
              processed_at: now,
              created_at: now,
              admin_notes: `Refund for rejected order #${selectedOrder.id}`,
              approval_notes: adminNotes
            });

          if (transactionError) throw transactionError;
        }
      }

      // Create audit log entry
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('admin_audit_logs')
          .insert({
            admin_user_id: user?.id || null,
            action_type: isApproved ? 'approve_order' : 'reject_order',
            target_type: 'order',
            target_id: selectedOrder.id.toString(),
            notes: `${isApproved ? 'Approved' : 'Rejected'} order #${selectedOrder.id} for ${selectedOrder.phone_number}. Admin notes: ${adminNotes}`,
            created_at: now
          });
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError);
      }

      toast({
        title: "Success",
        description: `Order ${isApproved ? 'approved' : 'rejected'} successfully`
      });

      // Refresh data
      await fetchPendingOrders();

      // Close dialog
      setProcessingDialog(false);
      setSelectedOrder(null);
      setAdminNotes('');

    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${processingType} order`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (order: Order, type: 'approve' | 'reject') => {
    setSelectedOrder(order);
    setProcessingType(type);
    setAdminNotes('');
    setProcessingDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="text-green-600 border-green-600 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'MMK') => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <XCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Error Loading Pending Orders</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPendingOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Pending Orders Management
          </CardTitle>
          <CardDescription>
            Review and process pending product orders from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Total Orders: {orders.length} | 
              Pending: {orders.filter((o) => o.status === 'pending').length}
            </div>
            <Button onClick={fetchPendingOrders} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending orders found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const profile = userProfiles[order.user_id];
                    const product = products[order.product_id];
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {profile?.full_name || `User #${order.user_id}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {profile?.email || ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {product?.name || `Product #${order.product_id}`}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {order.operator}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-sm">
                              {order.phone_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total_price, order.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.credits_used} credits
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => openProcessDialog(order, 'approve')}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => openProcessDialog(order, 'reject')}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <Dialog open={processingDialog} onOpenChange={setProcessingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingType === 'approve' ? 'Approve' : 'Reject'} Order
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="space-y-2 mt-4">
                  <div><strong>Order ID:</strong> #{selectedOrder.id}</div>
                  <div><strong>User:</strong> {userProfiles[selectedOrder.user_id]?.full_name || `User #${selectedOrder.user_id}`}</div>
                  <div><strong>Product:</strong> {products[selectedOrder.product_id]?.name || `Product #${selectedOrder.product_id}`}</div>
                  <div><strong>Phone Number:</strong> {selectedOrder.phone_number}</div>
                  <div><strong>Amount:</strong> {formatCurrency(selectedOrder.total_price, selectedOrder.currency)}</div>
                  <div><strong>Credits Used:</strong> {selectedOrder.credits_used}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder={`Enter notes for ${processingType === 'approve' ? 'approval' : 'rejection'}...`}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            {processingType === 'reject' && selectedOrder && selectedOrder.credits_used > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Rejecting this order will refund {selectedOrder.credits_used} credits to the user's account.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProcessingDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessOrder}
              disabled={isProcessing}
              variant={processingType === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : processingType === 'approve' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {processingType === 'approve' ? 'Approve Order' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PendingOrdersManagement;