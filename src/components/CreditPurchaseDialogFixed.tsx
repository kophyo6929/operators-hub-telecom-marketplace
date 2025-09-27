import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Upload, CheckCircle, Clock, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CreditPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

type PurchaseStep = 'AMOUNT' | 'PAYMENT_METHOD' | 'PAYMENT_PROOF' | 'PROCESSING' | 'SUCCESS';

const CREDIT_PACKAGES = [
{ credits: 10, price: 1000, popular: false },
{ credits: 30, price: 3000, popular: true },
{ credits: 50, price: 5000, popular: false },
{ credits: 100, price: 10000, popular: false }];


const PAYMENT_METHODS = [
{ id: 'kpay', name: 'K PAY', icon: '💳', description: 'Mobile payment via K PAY app' },
{ id: 'wavepay', name: 'Wave Pay', icon: '📱', description: 'Digital wallet payment via Wave Pay' }];


export default function CreditPurchaseDialog({
  isOpen,
  onClose,
  currentBalance = 0,
  onBalanceUpdate
}: CreditPurchaseDialogProps) {
  const [step, setStep] = useState<PurchaseStep>('AMOUNT');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Reset all states when dialog opens
      setStep('AMOUNT');
      setSelectedPackage(null);
      setCustomAmount('');
      setPaymentMethod('');
      setPaymentProofFile(null);
      setUploading(false);
      setLoading(false);
    }
  }, [isOpen]);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase credits.",
          variant: "destructive"
        });
        navigate('/auth');
        onClose();
        return false;
      }
      return true;
    } catch (error) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive"
      });
      navigate('/auth');
      onClose();
      return false;
    }
  };

  const getSelectedCredits = () => {
    if (selectedPackage !== null) {
      return CREDIT_PACKAGES[selectedPackage].credits;
    }
    return parseInt(customAmount) || 0;
  };

  const getTotalPrice = () => {
    return getSelectedCredits() * 100; // 1 credit = 100 MMK
  };

  const handleAmountConfirm = async () => {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    const credits = getSelectedCredits();
    if (credits <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select a valid credit amount.",
        variant: "destructive"
      });
      return;
    }

    if (credits > 1000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum 1000 credits can be purchased at once.",
        variant: "destructive"
      });
      return;
    }

    setStep('PAYMENT_METHOD');
  };

  const handlePaymentMethodConfirm = () => {
    if (!paymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep('PAYMENT_PROOF');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, GIF).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setPaymentProofFile(file);
  };

  const handleFinalConfirm = async () => {
    if (!paymentProofFile) {
      toast({
        title: "Upload Required",
        description: "Please upload your payment proof screenshot.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStep('PROCESSING');

    try {
      // Get user info
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      setUploading(true);

      // Create payment request record using Supabase client
      const { error: insertError } = await supabase.
      from('payment_requests').
      insert({
        user_id: session.user.id,
        credits_requested: getSelectedCredits(),
        total_cost_mmk: getTotalPrice(),
        payment_method: PAYMENT_METHODS.find((pm) => pm.id === paymentMethod)?.name || paymentMethod,
        status: 'pending'
      });

      if (insertError) {
        throw new Error('Failed to create payment request: ' + insertError.message);
      }

      setStep('SUCCESS');
      toast({
        title: "Purchase Request Submitted!",
        description: `Your request for ${getSelectedCredits()} credits (${getTotalPrice().toLocaleString()} MMK) has been submitted for admin approval.`
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setStep('PAYMENT_PROOF');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'PAYMENT_METHOD':
        setStep('AMOUNT');
        break;
      case 'PAYMENT_PROOF':
        setStep('PAYMENT_METHOD');
        break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'AMOUNT':
        return 'Purchase Credits';
      case 'PAYMENT_METHOD':
        return 'Select Payment Method';
      case 'PAYMENT_PROOF':
        return 'Upload Payment Proof';
      case 'PROCESSING':
        return 'Processing Request';
      case 'SUCCESS':
        return 'Request Submitted!';
      default:
        return 'Purchase Credits';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'AMOUNT':
        return 'Choose the amount of credits you want to purchase (100 MMK = 1 Credit)';
      case 'PAYMENT_METHOD':
        return 'Choose your preferred payment method';
      case 'PAYMENT_PROOF':
        return 'Upload a screenshot of your payment confirmation';
      case 'PROCESSING':
        return 'Please wait while we process your request...';
      case 'SUCCESS':
        return 'Your purchase request has been submitted and is pending admin approval';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'AMOUNT' && <CreditCard className="h-5 w-5" />}
            {step === 'PAYMENT_METHOD' && <Smartphone className="h-5 w-5" />}
            {step === 'PAYMENT_PROOF' && <Upload className="h-5 w-5" />}
            {step === 'SUCCESS' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {step === 'PROCESSING' && <Clock className="h-5 w-5" />}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Amount Selection */}
          {step === 'AMOUNT' &&
          <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Credit Packages</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CREDIT_PACKAGES.map((pkg, index) =>
                <Card
                  key={index}
                  className={`cursor-pointer transition-all relative ${
                  selectedPackage === index ?
                  'ring-2 ring-blue-500 bg-blue-50' :
                  'hover:shadow-md'}`
                  }
                  onClick={() => {
                    setSelectedPackage(index);
                    setCustomAmount('');
                  }}>

                      {pkg.popular &&
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                  }
                      <CardContent className="p-4 text-center">
                        <div className="font-bold text-lg">{pkg.credits}</div>
                        <div className="text-sm text-muted-foreground">Credits</div>
                        <div className="text-sm font-medium mt-1">
                          {pkg.price.toLocaleString()} MMK
                        </div>
                      </CardContent>
                    </Card>
                )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom" className="text-base font-medium">
                  Custom Amount
                </Label>
                <Input
                id="custom"
                type="number"
                min="1"
                max="1000"
                placeholder="Enter number of credits (max 1000)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPackage(null);
                }} />

                {customAmount && parseInt(customAmount) > 0 &&
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    <span>
                      Total: {(parseInt(customAmount) * 100).toLocaleString()} MMK
                    </span>
                  </div>
              }
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-700">Exchange Rate:</span>
                  <span className="font-medium text-blue-800">1 Credit = 100 MMK</span>
                </div>
                {currentBalance > 0 &&
              <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Current Balance:</span>
                    <span className="font-medium text-blue-800">
                      {currentBalance.toLocaleString()} Credits
                    </span>
                  </div>
              }
              </div>
            </div>
          }

          {/* Step 2: Payment Method Selection */}
          {step === 'PAYMENT_METHOD' &&
          <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-blue-800 font-medium text-lg">
                    Purchase Summary
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    {getSelectedCredits()} credits for {getTotalPrice().toLocaleString()} MMK
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Select Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {PAYMENT_METHODS.map((method) =>
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                  paymentMethod === method.id ?
                  'ring-2 ring-blue-500 bg-blue-50' :
                  'hover:shadow-sm'}`
                  }
                  onClick={() => setPaymentMethod(method.id)}>

                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <Label htmlFor={method.id} className="cursor-pointer font-medium">
                                {method.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )}
                </RadioGroup>
              </div>
            </div>
          }

          {/* Step 3: Payment Proof Upload */}
          {step === 'PAYMENT_PROOF' &&
          <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-amber-800 font-medium">
                    Payment Instructions
                  </p>
                  <p className="text-amber-700 text-sm mt-2">
                    Please make payment of <strong>{getTotalPrice().toLocaleString()} MMK</strong> using{' '}
                    <strong>{PAYMENT_METHODS.find((pm) => pm.id === paymentMethod)?.name}</strong> and upload the screenshot below.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="payment-proof" className="text-base font-medium">
                  Upload Payment Screenshot *
                </Label>
                <Input
                id="payment-proof"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer" />

                {paymentProofFile &&
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>{paymentProofFile.name} selected</span>
                  </div>
              }
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF (Maximum file size: 5MB)
                </p>
              </div>
            </div>
          }

          {/* Step 4: Processing */}
          {step === 'PROCESSING' &&
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <LoadingSpinner />
              <p className="text-gray-600 text-center">
                {uploading ? 'Uploading payment proof...' : 'Submitting purchase request...'}
              </p>
            </div>
          }

          {/* Step 5: Success */}
          {step === 'SUCCESS' &&
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">Request Submitted Successfully!</p>
                <p className="text-sm text-gray-600">
                  Your request for <strong>{getSelectedCredits()} credits</strong> ({getTotalPrice().toLocaleString()} MMK) is now pending admin approval.
                </p>
                <p className="text-xs text-gray-500">
                  You will be notified once your request is processed.
                </p>
                <p className="text-xs text-gray-500">
                  This dialog will close automatically in a few seconds.
                </p>
              </div>
            </div>
          }
        </div>

        {/* Footer Buttons */}
        {step === 'AMOUNT' &&
        <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
            onClick={handleAmountConfirm}
            disabled={getSelectedCredits() <= 0}>

              Continue
            </Button>
          </DialogFooter>
        }

        {step === 'PAYMENT_METHOD' &&
        <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
            onClick={handlePaymentMethodConfirm}
            disabled={!paymentMethod}>

              Continue
            </Button>
          </DialogFooter>
        }

        {step === 'PAYMENT_PROOF' &&
        <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button
            onClick={handleFinalConfirm}
            disabled={!paymentProofFile || loading}>

              {loading ? 'Processing...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        }
      </DialogContent>
    </Dialog>);

}