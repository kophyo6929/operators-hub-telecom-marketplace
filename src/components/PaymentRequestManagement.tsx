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
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRequest {
  id: number;
  user_id: string;
  credits_requested: number;
  total_cost_mmk: number;
  payment_method: string;
  payment_proof_file_id: number;
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

export function PaymentRequestManagement() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [processingDialog, setProcessingDialog] = useState(false);
  const [processingType, setProcessingType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch payment requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (requestsError) throw requestsError;

      const paymentRequests = requestsData || [];
      setRequests(paymentRequests);

      // Fetch user profiles for all unique user IDs
      const userIds = [...new Set(paymentRequests.map((req) => req.user_id))];
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment requests');
      console.error('Error fetching payment requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);

      const isApproved = processingType === 'approve';
      const now = new Date().toISOString();

      // Update the payment request status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: isApproved ? 'approved' : 'rejected',
          processed_at: now,
          admin_notes: adminNotes
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // If approved, add credits to user account
      if (isApproved) {
        const userProfile = userProfiles[selectedRequest.user_id];
        if (!userProfile) {
          throw new Error('User profile not found. Cannot process credit approval.');
        }

        const newBalance = userProfile.credits_balance + selectedRequest.credits_requested;

        // Update user's credit balance
        const { error: balanceError } = await supabase
          .from('user_profiles')
          .update({
            credits_balance: newBalance
          })
          .eq('user_id', selectedRequest.user_id);

        if (balanceError) throw balanceError;

        // Create a credit transaction record
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: selectedRequest.user_id,
            transaction_type: 'purchase',
            mmk_amount: selectedRequest.total_cost_mmk,
            credit_amount: selectedRequest.credits_requested,
            currency: 'MMK',
            status: 'completed',
            payment_method: selectedRequest.payment_method,
            payment_reference: `REQ-${selectedRequest.id}`,
            previous_balance: userProfile.credits_balance,
            new_balance: newBalance,
            processed_at: now,
            created_at: now,
            admin_notes: `Approved payment request #${selectedRequest.id}`,
            approval_notes: adminNotes
          });

        if (transactionError) throw transactionError;
      }

      // Create audit log entry
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('admin_audit_logs')
          .insert({
            admin_user_id: user?.id || null,
            action_type: isApproved ? 'approve_payment' : 'reject_payment',
            target_type: 'payment_request',
            target_id: selectedRequest.id.toString(),
            notes: `${isApproved ? 'Approved' : 'Rejected'} payment request #${selectedRequest.id} for ${selectedRequest.credits_requested} credits. Admin notes: ${adminNotes}`,
            created_at: now
          });
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError);
      }

      toast({
        title: "Success",
        description: `Payment request ${isApproved ? 'approved' : 'rejected'} successfully`
      });

      // Refresh data
      await fetchPaymentRequests();

      // Close dialog
      setProcessingDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');

    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${processingType} payment request`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (request: PaymentRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setProcessingType(type);
    setAdminNotes('');
    setProcessingDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-600 border-green-600 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
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
            <h3 className="font-semibold mb-2">Error Loading Payment Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPaymentRequests}>
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
            <CreditCard className="w-5 h-5" />
            Payment Request Management
          </CardTitle>
          <CardDescription>
            Review and process credit purchase payment requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Total Requests: {requests.length} | 
              Pending: {requests.filter((r) => r.status === 'pending').length} | 
              Processed: {requests.filter((r) => r.status !== 'pending').length}
            </div>
            <Button onClick={fetchPaymentRequests} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment requests found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const profile = userProfiles[request.user_id];
                    return (
                      <TableRow key={request.id}>
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
                                {profile?.full_name || `User #${request.user_id}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {profile?.email || ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.credits_requested} credits
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(request.total_cost_mmk)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {request.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => openProcessDialog(request, 'approve')}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => openProcessDialog(request, 'reject')}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
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
              {processingType === 'approve' ? 'Approve' : 'Reject'} Payment Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="space-y-2 mt-4">
                  <div><strong>Request ID:</strong> #{selectedRequest.id}</div>
                  <div><strong>User:</strong> {userProfiles[selectedRequest.user_id]?.full_name || `User #${selectedRequest.user_id}`}</div>
                  <div><strong>Credits:</strong> {selectedRequest.credits_requested}</div>
                  <div><strong>Amount:</strong> {formatCurrency(selectedRequest.total_cost_mmk)}</div>
                  <div><strong>Payment Method:</strong> {selectedRequest.payment_method}</div>
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
              onClick={handleProcessRequest}
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
              {processingType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentRequestManagement;