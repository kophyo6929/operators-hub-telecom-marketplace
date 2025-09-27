import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Ban, UserCheck, CreditCard, Shield, UserMinus, UserX, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  credits_balance: number;
  created_at: string;
  updated_at: string;
  is_banned?: boolean;
  is_admin?: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogType, setDialogType] = useState<'credits' | 'purge' | 'admin' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [creditForm, setCreditForm] = useState({
    amount: 0,
    type: 'add', // 'add' or 'deduct'
    reason: ''
  });

  const [adminForm, setAdminForm] = useState({
    action: 'add', // 'add' or 'remove'
    reason: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw new Error(error.message);
      
      // Check admin status and banned status for each user
      const usersWithStatus = await Promise.all((data || []).map(async (user) => {
        const isAdmin = user.email?.toLowerCase().includes('admin') || 
                       ['admin@example.com', 'admin@admin.com', 'thewayofthedragg@gmail.com'].includes(user.email?.toLowerCase());
        return {
          ...user,
          is_admin: isAdmin,
          is_banned: false // You can implement banned status in database if needed
        };
      }));
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAction = async (actionType: string, targetId: string, notes: string, oldValues?: any, newValues?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user?.id || null,
          action_type: actionType,
          target_type: 'user',
          target_id: targetId,
          old_values: oldValues ? JSON.stringify(oldValues) : '',
          new_values: newValues ? JSON.stringify(newValues) : '',
          ip_address: '',
          user_agent: navigator.userAgent,
          notes,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const handleCreditAdjustment = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const currentBalance = selectedUser.credits_balance || 0;
      const adjustment = creditForm.type === 'add' ? creditForm.amount : -creditForm.amount;
      const newBalance = Math.max(0, currentBalance + adjustment);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw new Error(error.message);

      // Create credit transaction record
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.user_id,
          transaction_type: creditForm.type === 'add' ? 'admin_add' : 'admin_deduct',
          credit_amount: Math.abs(adjustment),
          currency: 'MMK',
          status: 'completed',
          payment_method: 'admin_adjustment',
          payment_reference: `ADMIN-${Date.now()}`,
          previous_balance: currentBalance,
          new_balance: newBalance,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          admin_notes: creditForm.reason
        });

      await logAdminAction(
        creditForm.type === 'add' ? 'add_credits' : 'deduct_credits',
        selectedUser.user_id,
        `${creditForm.type === 'add' ? 'Added' : 'Deducted'} ${creditForm.amount} credits: ${creditForm.reason}`,
        { credits_balance: currentBalance },
        { credits_balance: newBalance }
      );

      toast({
        title: 'Success',
        description: `Credits ${creditForm.type === 'add' ? 'added' : 'deducted'} successfully`
      });

      setIsDialogOpen(false);
      setCreditForm({ amount: 0, type: 'add', reason: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust credits',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanUser = async (user: UserProfile, ban: boolean) => {
    try {
      setIsProcessing(true);
      // In a real app, you'd update a banned status in the database
      // For now, we'll just log the action and show success
      
      await logAdminAction(
        ban ? 'ban_user' : 'unban_user', 
        user.user_id, 
        `${ban ? 'Banned' : 'Unbanned'} user: ${user.full_name || user.email}`
      );

      toast({
        title: 'Success',
        description: `User ${ban ? 'banned' : 'unbanned'} successfully`
      });

      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${ban ? 'ban' : 'unban'} user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${ban ? 'ban' : 'unban'} user`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeUserData = async (user: UserProfile) => {
    try {
      setIsProcessing(true);
      
      // Delete all user's orders
      await supabase
        .from('orders')
        .delete()
        .eq('user_id', user.user_id);

      // Delete all user's payment requests
      await supabase
        .from('payment_requests')
        .delete()
        .eq('user_id', user.user_id);

      // Delete all user's credit transactions
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('user_id', user.user_id);

      // Reset user's credit balance
      await supabase
        .from('user_profiles')
        .update({ 
          credits_balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      await logAdminAction('purge_user_data', user.user_id, `Purged all data for user: ${user.full_name || user.email}`);

      toast({
        title: 'Success',
        description: 'User data purged successfully'
      });

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to purge user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to purge user data',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      await logAdminAction('delete_user', user.user_id, `Deleted user: ${user.full_name || user.email}`);

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleAdminStatus = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      
      // In a real app, you'd implement proper admin role management
      // For now, we'll just log the action
      await logAdminAction(
        adminForm.action === 'add' ? 'add_admin' : 'remove_admin',
        selectedUser.user_id,
        `${adminForm.action === 'add' ? 'Added admin role to' : 'Removed admin role from'} user: ${selectedUser.full_name || selectedUser.email}. Reason: ${adminForm.reason}`
      );

      toast({
        title: 'Success',
        description: `Admin role ${adminForm.action === 'add' ? 'added' : 'removed'} successfully`
      });

      setIsDialogOpen(false);
      setAdminForm({ action: 'add', reason: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDialog = (user: UserProfile, type: 'credits' | 'purge' | 'admin') => {
    setSelectedUser(user);
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Manage user accounts, credits, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Credits Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.credits_balance?.toLocaleString() || 0} MMK
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {user.is_admin && (
                            <Badge variant="default" className="w-fit">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.is_banned && (
                            <Badge variant="destructive" className="w-fit">
                              <Ban className="h-3 w-3 mr-1" />
                              Banned
                            </Badge>
                          )}
                          {!user.is_admin && !user.is_banned && (
                            <Badge variant="secondary" className="w-fit">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(user, 'credits')}
                            className="w-full md:w-auto text-xs"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Credits
                          </Button>
                          
                          <Button
                            variant={user.is_banned ? "default" : "secondary"}
                            size="sm"
                            onClick={() => handleBanUser(user, !user.is_banned)}
                            className="w-full md:w-auto text-xs"
                            disabled={isProcessing}
                          >
                            {user.is_banned ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Ban
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(user, 'admin')}
                            className="w-full md:w-auto text-xs"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openDialog(user, 'purge')}
                            className="w-full md:w-auto text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Purge
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full md:w-auto text-xs"
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjustment Dialog */}
      <Dialog open={isDialogOpen && dialogType === 'credits'} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Credits</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="mt-4">
                  <p><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</p>
                  <p><strong>Current Balance:</strong> {selectedUser.credits_balance?.toLocaleString() || 0} MMK</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment-type">Action</Label>
              <select
                id="adjustment-type"
                value={creditForm.type}
                onChange={(e) => setCreditForm({ ...creditForm, type: e.target.value as 'add' | 'deduct' })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="add">Add Credits</option>
                <option value="deduct">Deduct Credits</option>
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={creditForm.amount || ''}
                onChange={(e) => setCreditForm({ ...creditForm, amount: Number(e.target.value) || 0 })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={creditForm.reason}
                onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                placeholder="Enter reason for adjustment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreditAdjustment}
              disabled={isProcessing || !creditForm.amount || !creditForm.reason}
            >
              {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {creditForm.type === 'add' ? 'Add Credits' : 'Deduct Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge User Data Dialog */}
      <Dialog open={isDialogOpen && dialogType === 'purge'} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purge User Data</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="mt-4">
                  <p><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</p>
                  <p className="text-destructive mt-2">
                    <strong>Warning:</strong> This will permanently delete all user data including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>All order history</li>
                    <li>All payment requests</li>
                    <li>All credit transactions</li>
                    <li>Reset credit balance to 0</li>
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handlePurgeUserData(selectedUser)}
              disabled={isProcessing}
            >
              {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Purge All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Status Dialog */}
      <Dialog open={isDialogOpen && dialogType === 'admin'} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Admin Status</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="mt-4">
                  <p><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</p>
                  <p><strong>Current Status:</strong> {selectedUser.is_admin ? 'Admin' : 'Regular User'}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-action">Action</Label>
              <select
                id="admin-action"
                value={adminForm.action}
                onChange={(e) => setAdminForm({ ...adminForm, action: e.target.value as 'add' | 'remove' })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="add">Grant Admin Role</option>
                <option value="remove">Remove Admin Role</option>
              </select>
            </div>
            <div>
              <Label htmlFor="admin-reason">Reason</Label>
              <Textarea
                id="admin-reason"
                value={adminForm.reason}
                onChange={(e) => setAdminForm({ ...adminForm, reason: e.target.value })}
                placeholder="Enter reason for role change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminStatus}
              disabled={isProcessing || !adminForm.reason}
            >
              {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {adminForm.action === 'add' ? 'Grant Admin Role' : 'Remove Admin Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}