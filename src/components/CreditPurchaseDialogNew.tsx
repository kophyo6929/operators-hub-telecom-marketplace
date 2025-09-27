import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Smartphone, 
  Upload, 
  CheckCircle, 
  Clock, 
  Calculator, 
  Link as LinkIcon,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import wavePayQR from '@/assets/wave-pay-qr.jpg';
import kpayQR from '@/assets/kpay-qr.jpg';

interface CreditPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

interface SiteSettings {
  kpay_account_name: string;
  kpay_account_number: string;
  wave_pay_account_name: string;
  wave_pay_account_number: string;
  credit_rate_mmk: number;
}

type Step = 'AMOUNT' | 'PAYMENT_METHOD' | 'PAYMENT_PROOF' | 'SUCCESS';

const CREDIT_PACKAGES = [
  { credits: 10, price: 1000, popular: false },
  { credits: 30, price: 3000, popular: true },
  { credits: 50, price: 5000, popular: false },
  { credits: 100, price: 10000, popular: false }
];

const CreditPurchaseDialog: React.FC<CreditPurchaseDialogProps> = ({
  isOpen,
  onClose,
  currentBalance = 0,
  onBalanceUpdate
}) => {
  const [step, setStep] = useState<Step>('AMOUNT');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Ref to programmatically trigger file picker (better on mobile browsers)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('AMOUNT');
      setSelectedPackage(null);
      setCustomAmount('');
      setPaymentMethod('');
      setPaymentProofFile(null);
      setLoading(false);
      setUploading(false);
      fetchSiteSettings();
    }
  }, [isOpen]);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setSiteSettings(data);
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  };

  const checkAuthentication = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const getSelectedCredits = () => {
    if (selectedPackage !== null) {
      return CREDIT_PACKAGES[selectedPackage].credits;
    }
    return parseInt(customAmount) || 0;
  };

  const getTotalPrice = () => {
    const credits = getSelectedCredits();
    const rate = siteSettings?.credit_rate_mmk || 100;
    return credits * rate;
  };

  const getStepProgress = () => {
    switch (step) {
      case 'AMOUNT': return 25;
      case 'PAYMENT_METHOD': return 50;
      case 'PAYMENT_PROOF': return 75;
      case 'SUCCESS': return 100;
      default: return 0;
    }
  };

  const handleAmountConfirm = async () => {
    if (!await checkAuthentication()) return;

    const credits = getSelectedCredits();
    if (credits < 1 || credits > 10000) {
      toast({
        title: "Invalid Amount",
        description: "Please select between 1 and 10,000 credits",
        variant: "destructive"
      });
      return;
    }

    setStep('PAYMENT_METHOD');
  };

  const handlePaymentMethodConfirm = () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }
    setStep('PAYMENT_PROOF');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setPaymentProofFile(file);
  };

  const handleFinalConfirm = async () => {
    if (!paymentProofFile) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload a screenshot of your payment",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Upload payment proof file to user-scoped folder
      const fileExt = paymentProofFile.name.split('.').pop();
      const fileName = `${session.user.id}/payment-proof-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProofFile);

      if (uploadError) throw new Error('Failed to upload payment proof: ' + uploadError.message);

      // Create payment request
      const { error: insertError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: session.user.id,
          credits_requested: getSelectedCredits(),
          total_cost_mmk: getTotalPrice(),
          payment_method: paymentMethod,
          status: 'pending'
        });

      if (insertError) throw new Error('Failed to create payment request: ' + insertError.message);

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

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-4">
        {[
          { key: 'AMOUNT', label: 'Select Amount', icon: CreditCard },
          { key: 'PAYMENT_METHOD', label: 'Payment Method', icon: Smartphone },
          { key: 'PAYMENT_PROOF', label: 'Upload Proof', icon: Upload },
          { key: 'SUCCESS', label: 'Approval Status', icon: CheckCircle }
        ].map((stepItem, index) => {
          const Icon = stepItem.icon;
          const isActive = step === stepItem.key;
          const isCompleted = getStepProgress() > (index + 1) * 25;
          
          return (
            <div key={stepItem.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all mb-2
                  ${isActive || isCompleted ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' : 'bg-gray-200 text-gray-500'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs text-center font-medium ${isActive ? 'text-yellow-400' : isCompleted ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {stepItem.label}
                </span>
              </div>
              {index < 3 && (
                <div className={`h-0.5 flex-1 mx-4 ${
                  getStepProgress() > (index + 1) * 25 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPaymentInstructions = () => {
    if (!siteSettings) return null;

    if (paymentMethod === 'kpay') {
      return (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Payment Instructions - K PAY</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-blue-800">Step-by-step Guide:</h4>
                <div className="space-y-3">
                  {[
                    'Open your K PAY app on your mobile device',
                    'Select "Transfer" or "Send Money" option',
                    `Enter recipient phone: ${siteSettings.kpay_account_number}`,
                    `Enter amount: ${getTotalPrice().toLocaleString()} MMK`,
                    'Add reference: Your TeleShop username',
                    'Complete the transfer and take a screenshot',
                    'Upload the screenshot proof below'
                  ].map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <Badge variant="outline" className="bg-blue-600 text-white min-w-6 h-6 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-blue-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-blue-800">Payment Details:</h4>
                <div className="bg-blue-600 rounded-lg p-4 border border-blue-200">
                  <img src={kpayQR} alt="K Pay QR Code" className="w-full max-w-48 mx-auto mb-4" />
                  <p className="text-center text-sm font-medium text-white mb-2">
                    {siteSettings?.kpay_account_name || 'Hlaing Ko Phyo'}
                  </p>
                  <p className="text-center text-sm font-medium text-white mb-4">
                    {siteSettings?.kpay_account_number || '09883249943'}
                  </p>
                  <p className="text-center text-sm text-blue-100 mb-4">Scan QR code with your K PAY app</p>
                  <div className="space-y-2 text-sm bg-white rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">Amount:</span>
                      <span className="font-bold text-gray-900">{getTotalPrice().toLocaleString()} MMK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">Credits:</span>
                      <span className="font-bold text-gray-900">{getSelectedCredits()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">Processing:</span>
                      <span className="font-bold text-gray-900">Within 2-4 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-orange-800">Important Notes:</h5>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1">
                    <li>• Ensure the exact amount is transferred</li>
                    <li>• Include your reference information</li>
                    <li>• Take a clear screenshot of the success page</li>
                    <li>• Credits will be added after admin approval</li>
                    <li>• Keep your transaction receipt for records</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else if (paymentMethod === 'wavepay') {
      return (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Payment Instructions - Wave Pay</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-yellow-800">Step-by-step Guide:</h4>
                <div className="space-y-3">
                  {[
                    'Open your Wave Pay app on your mobile device',
                    'Tap on "Send Money" or "Transfer"',
                    `Enter recipient number: ${siteSettings.wave_pay_account_number}`,
                    `Enter transfer amount: ${getTotalPrice().toLocaleString()} MMK`,
                    'Add note: Your TeleShop account email',
                    'Confirm and complete the payment',
                    'Take a screenshot of the success page',
                    'Upload the payment proof below'
                  ].map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <Badge variant="outline" className="bg-yellow-600 text-white min-w-6 h-6 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-yellow-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-yellow-800">Payment Details:</h4>
                <div className="bg-yellow-500 rounded-lg p-4 border border-yellow-200">
                  <img src={wavePayQR} alt="Wave Pay QR Code" className="w-full max-w-48 mx-auto mb-4" />
                  <p className="text-center text-sm font-medium text-black mb-2">
                    {siteSettings?.wave_pay_account_name || 'Hlaing Ko Phyo'}
                  </p>
                  <p className="text-center text-sm font-medium text-black mb-4">
                    {siteSettings?.wave_pay_account_number || '09883249943'}
                  </p>
                  <p className="text-center text-sm text-yellow-900 mb-4">Scan QR code with your Wave Pay app</p>
                  <div className="space-y-2 text-sm bg-white rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-yellow-600 font-medium">Amount:</span>
                      <span className="font-bold text-gray-900">{getTotalPrice().toLocaleString()} MMK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600 font-medium">Credits:</span>
                      <span className="font-bold text-gray-900">{getSelectedCredits()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600 font-medium">Processing:</span>
                      <span className="font-bold text-gray-900">Within 2-4 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-orange-800">Important Notes:</h5>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1">
                    <li>• Ensure the exact amount is transferred</li>
                    <li>• Include your reference information</li>
                    <li>• Take a clear screenshot of the success page</li>
                    <li>• Credits will be added after admin approval</li>
                    <li>• Keep your transaction receipt for records</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-yellow-500/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-yellow-400" />
            Purchase Credits
          </DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-6">
          {/* Step 1: Amount Selection */}
          {step === 'AMOUNT' && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-yellow-400/30">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Credit Packages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {CREDIT_PACKAGES.map((pkg, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all relative border-2 ${
                          selectedPackage === index 
                            ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/20 to-orange-400/10 shadow-lg shadow-yellow-400/20' 
                            : 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/30 hover:border-yellow-400/50'
                        }`}
                        onClick={() => {
                          setSelectedPackage(index);
                          setCustomAmount('');
                        }}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-medium">
                            Popular
                          </div>
                        )}
                        <CardContent className="p-4 text-center">
                          <div className="font-bold text-lg text-white">{pkg.credits}</div>
                          <div className="text-sm text-gray-300">Credits</div>
                          <div className="text-sm font-medium mt-1 text-yellow-400">
                            {pkg.price.toLocaleString()} MMK
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="custom" className="text-base font-medium">Custom Amount</Label>
                    <Input
                      id="custom"
                      type="number"
                      min="1"
                      max="10000"
                      placeholder="Enter number of credits (max 10,000)"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedPackage(null);
                      }}
                    />
                    {customAmount && parseInt(customAmount) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calculator className="h-4 w-4" />
                        <span>Total: {(parseInt(customAmount) * (siteSettings?.credit_rate_mmk || 100)).toLocaleString()} MMK</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">1 Credit = {siteSettings?.credit_rate_mmk || 100} MMK</span>
                    </div>
                    {currentBalance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Current Balance:</span>
                        <span className="font-medium">{currentBalance.toLocaleString()} Credits</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleAmountConfirm} disabled={getSelectedCredits() < 1}>
                  Continue to Payment Method
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 'PAYMENT_METHOD' && (
            <div className="space-y-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="font-medium text-lg">Purchase Summary</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getSelectedCredits()} credits for {getTotalPrice().toLocaleString()} MMK
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Select Payment Method</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setPaymentMethod('kpay')}>
                      <RadioGroupItem value="kpay" id="kpay" />
                      <div className="flex-1">
                        <Label htmlFor="kpay" className="cursor-pointer font-medium">K Pay</Label>
                        <p className="text-sm text-muted-foreground">Mobile payment via K Pay app</p>
                      </div>
                      <div className="text-blue-600 font-semibold">KPay</div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => setPaymentMethod('wavepay')}>
                      <RadioGroupItem value="wavepay" id="wavepay" />
                      <div className="flex-1">
                        <Label htmlFor="wavepay" className="cursor-pointer font-medium">Wave Pay</Label>
                        <p className="text-sm text-muted-foreground">Mobile payment via Wave Pay app</p>
                      </div>
                      <div className="text-yellow-600 font-semibold">Wave</div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handlePaymentMethodConfirm} disabled={!paymentMethod}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Proof Upload */}
          {step === 'PAYMENT_PROOF' && (
            <div className="space-y-6">
              {renderPaymentInstructions()}

              <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-yellow-400/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-medium bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Upload Payment Proof</h3>
                  </div>
                  
                  <div className="border-2 border-dashed border-yellow-400/50 rounded-lg p-8 text-center bg-gradient-to-br from-gray-800/30 to-gray-700/20">
                    {paymentProofFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Image uploaded successfully</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {paymentProofFile.name}
                        </p>
                        <p className="text-sm text-gray-300">
                          Make sure your screenshot shows the complete transaction details
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setPaymentProofFile(null)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 mx-auto text-yellow-400 opacity-75" />
                        <div>
                          <p className="font-medium text-white">Upload Payment Screenshot</p>
                          <p className="text-sm text-gray-300">Click the button below to select your payment proof</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="payment-proof"
                          ref={fileInputRef}
                        />
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }} 
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-semibold border-0"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Upload Guidelines:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Clear, readable screenshot
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Show complete transaction
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Include amount and reference
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Max file size: 5MB
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="border-gray-600 text-gray-300 hover:bg-gray-800">Back</Button>
                <Button 
                  onClick={handleFinalConfirm} 
                  disabled={!paymentProofFile || loading}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-semibold shadow-lg"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Purchase Request'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'SUCCESS' && (
            <Card className="border-green-400/50 bg-gradient-to-br from-green-900/60 to-green-800/40">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-300 mb-2">Request Submitted Successfully!</h3>
                <p className="text-green-200 mb-4">
                  Your payment request for {getSelectedCredits()} credits has been submitted for admin review.
                </p>
                <div className="bg-green-800/30 rounded-lg p-4 border border-green-400/30 mb-4">
                  <h4 className="font-medium text-green-300 mb-2">What happens next?</h4>
                  <div className="text-sm text-green-200 space-y-1">
                    <p>1. Our admin team will verify your payment proof</p>
                    <p>2. Credits will be added to your account within 2-4 hours</p>
                    <p>3. You'll receive a notification once approved</p>
                  </div>
                </div>
                <Button onClick={onClose} className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-semibold">
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseDialog;