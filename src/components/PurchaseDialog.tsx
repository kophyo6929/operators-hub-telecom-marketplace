import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';
import { Smartphone, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  userBalance: number;
  onPurchaseComplete: (newBalance: number) => void;
}

type PurchaseStep = 'DETAILS' | 'PHONE_INPUT' | 'PROCESSING' | 'SUCCESS';

export default function PurchaseDialog({
  isOpen,
  onClose,
  product,
  userBalance,
  onPurchaseComplete
}: PurchaseDialogProps) {
  const [step, setStep] = useState<PurchaseStep>('DETAILS');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setPhoneNumber('');
      setPhoneError('');
      setLoading(false);
    }
  }, [isOpen]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^09\d{7,9}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (value && !validatePhoneNumber(value)) {
      setPhoneError('Please enter a valid Myanmar phone number (e.g., 09123456789)');
    } else {
      setPhoneError('');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!product) return;

    if (userBalanceInMMK < product.price) {
      toast({
        title: "Insufficient Balance",
        description: "Your current balance is not enough for this purchase.",
        variant: "destructive"
      });
      return;
    }

    setStep('PHONE_INPUT');
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid Myanmar phone number (e.g., 09123456789)');
      return;
    }

    if (!product) return;

    setLoading(true);
    setStep('PROCESSING');

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Failed to get user information');
      }

          // Check user profile exists, create if not
          let { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          let currentBalance = userBalance;

          if (!userProfile) {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                credits_balance: userBalance,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) throw new Error('Failed to create user profile');
            userProfile = newProfile;
          } else if (profileError) {
            throw new Error('Failed to get user profile');
          }

      currentBalance = userProfile?.credits_balance || 0;

      // Double-check balance (convert credits to MMK for comparison)
      const currentBalanceInMMK = currentBalance * 100;
      if (currentBalanceInMMK < product.price) {
        throw new Error('Insufficient balance for this purchase');
      }

      // Calculate new balance in credits (price is in MMK, so divide by 100)
      const creditsToDeduct = Math.ceil(product.price / 100);
      const newBalance = currentBalance - creditsToDeduct;

      // Update user balance
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) throw new Error('Failed to update user balance');

      // Create order record
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          total_price: product.price,
          credits_used: creditsToDeduct,
          currency: product.currency,
          operator: product.operator,
          phone_number: phoneNumber,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (orderError) throw new Error('Failed to create order record');

      setStep('SUCCESS');
      onPurchaseComplete(newBalance);

      toast({
        title: "Order Submitted Successfully!",
        description: `Your order for ${product.name} is pending admin approval. You will be notified once processed.`
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setStep('PHONE_INPUT');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step !== 'PROCESSING') {
      onClose();
    }
  };

  // Convert credits to MMK for display (1 credit = 100 MMK)
  const userBalanceInMMK = userBalance * 100;
  const balanceAfterPurchase = product ? userBalanceInMMK - product.price : userBalanceInMMK;

  const getStepTitle = () => {
    switch (step) {
      case 'DETAILS':
        return 'Purchase Confirmation';
      case 'PHONE_INPUT':
        return 'Enter Phone Number';
      case 'PROCESSING':
        return 'Processing Purchase';
      case 'SUCCESS':
        return 'Purchase Successful!';
      default:
        return 'Purchase';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'DETAILS':
        return 'Review your purchase details and confirm';
      case 'PHONE_INPUT':
        return 'Enter the phone number to receive this product';
      case 'PROCESSING':
        return 'Please wait while we process your purchase...';
      case 'SUCCESS':
        return 'Your purchase has been completed successfully!';
      default:
        return '';
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg glass-card border-0">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            {step === 'DETAILS' && <CreditCard className="h-6 w-6 text-amber-400" />}
            {step === 'PHONE_INPUT' && <Smartphone className="h-6 w-6 text-amber-400" />}
            {step === 'SUCCESS' && <CheckCircle className="h-6 w-6 text-green-400" />}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-base">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'DETAILS' && (
            <>
              {/* Product Details Card */}
              <div className="glass-card rounded-xl p-5 space-y-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Product:</span>
                  <span className="text-white font-semibold">{product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Price:</span>
                  <span className="font-bold text-xl bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Operator:</span>
                  <span className={`px-3 py-1.5 rounded-full text-white text-sm font-semibold ${
                    product.operator === 'MPT' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    product.operator === 'OOREDOO' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    product.operator === 'ATOM' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    {product.operator}
                  </span>
                </div>
              </div>

              {/* Balance Information Card */}
              <div className="glass-card rounded-xl p-5 space-y-4 border border-white/20 bg-gradient-to-r from-slate-900/50 to-gray-900/50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-200">Current Balance:</span>
                  <span className="font-bold text-white text-lg">{userBalanceInMMK.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-200">Balance After Purchase:</span>
                  <span className={`font-bold text-lg ${balanceAfterPurchase >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {balanceAfterPurchase.toLocaleString()} MMK
                  </span>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {balanceAfterPurchase < 0 && (
                <div className="glass-card rounded-xl p-4 border border-red-400/30 bg-gradient-to-r from-red-900/20 to-red-800/20">
                  <p className="text-red-300 font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Insufficient balance! You need {Math.abs(balanceAfterPurchase).toLocaleString()} MMK more.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'PHONE_INPUT' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-gray-200 font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09123456789"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`glass-card border-white/20 bg-slate-900/50 text-white placeholder:text-gray-400 focus:border-amber-400/50 focus:ring-amber-400/20 ${
                    phoneError ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/20' : ''
                  }`}
                />
                {phoneError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {phoneError}
                  </p>
                )}
              </div>
              <div className="glass-card rounded-xl p-4 border border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-cyan-800/20">
                <p className="text-blue-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <strong className="text-white">{product.name}</strong> will be delivered to this phone number.
                </p>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <LoadingSpinner />
              <p className="text-gray-300 text-lg">Processing your purchase...</p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <CheckCircle className="h-20 w-20 text-green-400" />
              <div className="text-center space-y-3">
                <p className="font-semibold text-xl text-white">Order submitted successfully!</p>
                <p className="text-gray-300">
                  Your order for {product.name} to <span className="text-white font-medium">{phoneNumber}</span> is pending admin approval.
                </p>
                <p className="text-gray-400 text-sm">
                  This dialog will close automatically in a few seconds.
                </p>
              </div>
            </div>
          )}
        </div>

        {step === 'DETAILS' && (
          <DialogFooter className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="glass-card border-white/20 text-gray-300 hover:text-white hover:border-white/40"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              disabled={balanceAfterPurchase < 0}
              className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        )}

        {step === 'PHONE_INPUT' && (
          <DialogFooter className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setStep('DETAILS')}
              className="glass-card border-white/20 text-gray-300 hover:text-white hover:border-white/40"
            >
              Back
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              disabled={!phoneNumber || !!phoneError || loading}
              className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Complete Purchase'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}