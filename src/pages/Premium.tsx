
import { useMemo, useState, useEffect } from 'react';
import { products, Product } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import CreditPurchaseDialog from '@/components/CreditPurchaseDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const Premium = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filter premium products (price >= 50,000 MMK, excluding Beautiful Numbers)
  const premiumProducts = useMemo(() => {
    return products.filter((product) =>
    product.price >= 50000 && product.category !== 'Beautiful Numbers'
    );
  }, []);

  useEffect(() => {
    loadUserBalance();
  }, []);

  const loadUserBalance = async () => {
    try {
      setIsBalanceLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setUser(null);
        setUserBalance(0);
        return;
      }

      setUser(user);

      // Get user profile to get balance
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setUserBalance(0);
      } else {
        setUserBalance(profile?.credits_balance || 0);
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
      setUser(null);
      setUserBalance(0);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleBuyCreditClick = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // User not authenticated, redirect to auth
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase credits.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // User is authenticated, open credit purchase dialog
      setIsCreditDialogOpen(true);
    } catch (error) {
      // Error checking auth, redirect to auth
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 flex-shrink-0">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:text-orange-400 hover:bg-white/10 transition-colors">

            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            Premium Products
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-6">
            Choose from our curated selection of telecom products from Myanmar's leading network operators
          </p>
          
          {/* Current Balance & Buy Credit Section */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-white/80 text-sm mb-1">Current Balance:</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {isBalanceLoading ?
                      <LoadingSpinner size="sm" /> :

                      `${(userBalance * 100).toLocaleString()} MMK`
                      }
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      ({userBalance.toLocaleString()} credits)
                    </div>
                  </div>
                <Button
                  onClick={handleBuyCreditClick}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 transform hover:scale-105">

                  Buy Credit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-16 flex-1">
        {/* Premium Products Grid */}
        {premiumProducts.length > 0 &&
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {premiumProducts.map((product) =>
          <ProductCard
            key={product.id}
            product={product} />

          )}
          </div>
        }

        {/* No premium products fallback */}
        {premiumProducts.length === 0 &&
        <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-white mb-4">
                No Premium Products Available
              </h3>
              <p className="text-white/70 mb-6">
                We're working on bringing you exclusive premium products soon.
              </p>
              <Button
              onClick={() => navigate('/browse?scrollTo=products')}
              className="btn-premium">

                Browse All Products
              </Button>
            </div>
          </div>
        }
      </div>

      {/* Credit Purchase Dialog */}
      <CreditPurchaseDialog
        isOpen={isCreditDialogOpen}
        onClose={() => setIsCreditDialogOpen(false)}
        currentBalance={userBalance}
        onBalanceUpdate={(newBalance) => {
          setUserBalance(newBalance);
        }} />

    </div>);

};

export default Premium;