import { useState, useMemo, useEffect } from "react";
import { type Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import LoadingSpinner from "./LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PurchaseDialog from "./PurchaseDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProductListing = () => {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkAuthStatus();
    fetchProducts();
    
    // Check for operator filter from URL
    const operator = searchParams.get('operator');
    if (operator && ['MPT', 'ATOM', 'MYTEL', 'OOREDOO'].includes(operator)) {
      setSelectedOperator(operator);
    }
  }, [searchParams]);

  // Scroll to products section when filters are applied
  useEffect(() => {
    if (selectedOperator || selectedCategory) {
      const productsSection = document.getElementById('products-grid');
      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [selectedOperator, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);

      const { data, error } = await supabase.
      from('products').
      select('*').
      eq('is_active', true).
      order('created_at', { ascending: false });

      if (error) throw error;
      const typedProducts = data?.map(product => ({
        ...product,
        operator: product.operator as "MPT" | "OOREDOO" | "ATOM" | "MYTEL",
        category: product.category as "Data" | "Minutes" | "Points" | "Packages" | "Beautiful Numbers"
      })) || [];
      setProducts(typedProducts);

      if ((typedProducts || []).length === 0) {
        setProductsError("No products found in the database. Please add some products through the admin panel or initialize sample data.");
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      setProductsError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        await loadUserBalance(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserBalance(0);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserBalance(0);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadUserBalance = async (userId: string) => {
    try {
      let { data: profile, error } = await supabase.
      from('user_profiles').
      select('credits_balance').
      eq('user_id', userId).
      single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!profile) {
        // Create initial profile with 0 balance
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: insertError } = await supabase.
          from('user_profiles').
          insert({
            user_id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            credits_balance: 0
          });

          if (insertError) {
            console.error('Failed to create user profile:', insertError);
          }
          setUserBalance(0);
        }
      } else {
        setUserBalance(Number(profile.credits_balance) || 0);
      }
    } catch (error) {
      console.error('Failed to load user balance:', error);
      setUserBalance(0);
    }
  };

  const handleProductSelect = (product: Product) => {
    try {
      setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    } catch (error) {
      console.error('Error selecting product:', error);
      toast({
        title: "Error selecting product",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePurchase = async (product: Product) => {
    if (checkingAuth) {
      toast({
        title: "Please wait",
        description: "Checking authentication status..."
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase products.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setSelectedProduct(product);
    setIsPurchaseDialogOpen(true);
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setUserBalance(newBalance);
    setIsPurchaseDialogOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesOperator = !selectedOperator || product.operator === selectedOperator;
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesOperator && matchesCategory;
    });
  }, [products, selectedOperator, selectedCategory]);

  return (
    <section id="premium-products" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 font-space-grotesk">
            Premium Products
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Choose from our curated selection of telecom products from Myanmar's leading network operators
          </p>
          {isAuthenticated &&
          <div className="mt-6 flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-6 py-3 rounded-xl border border-blue-500/30">
                <span className="text-sm font-medium">Current Balance:</span>
                <span className="font-bold">{((userBalance || 0) * 100).toLocaleString()} MMK</span>
              </div>
              <Button
              onClick={() => navigate('/premium')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">

                Buy Credit
              </Button>
            </div>
          }
        </div>

        {/* Filters */}
        <ProductFilters
          selectedOperator={selectedOperator}
          selectedCategory={selectedCategory}
          onOperatorChange={setSelectedOperator}
          onCategoryChange={setSelectedCategory} />

        {/* Results Count and Refresh */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-white/60 text-lg">
            Showing {filteredProducts.length} premium product{filteredProducts.length !== 1 ? 's' : ''}
            {selectedOperator && ` from ${selectedOperator}`}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loadingProducts}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit">

            <RefreshCw className={`h-4 w-4 mr-2 ${loadingProducts ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Product Grid */}
        <div id="products-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingProducts ?
          <div className="col-span-full flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div> :
          productsError ?
          <div className="col-span-full text-center py-20">
              <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto">
                <Alert className="mb-6">
                  <AlertDescription className="text-white">
                    {productsError}
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                  onClick={fetchProducts}
                  className="btn-premium px-8 py-3 rounded-xl font-semibold">

                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Loading
                  </Button>
                  {isAuthenticated &&
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="px-8 py-3 rounded-xl font-semibold border-white/20 text-white hover:bg-white/10">

                      Go to Admin Panel
                    </Button>
                }
                </div>
              </div>
            </div> :

          filteredProducts.map((product) =>
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={handleProductSelect}
            onPurchase={handlePurchase} />
          )
          }
        </div>

        {/* No Results */}
        {!loadingProducts && !productsError && filteredProducts.length === 0 && products.length > 0 &&
        <div className="text-center py-20">
            <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
              <p className="text-xl text-white/80 mb-4">
                No products found matching your criteria
              </p>
              <button
              onClick={() => {
                setSelectedOperator(null);
                setSelectedCategory(null);
              }}
              className="btn-premium px-8 py-3 rounded-xl font-semibold">
                Clear all filters
              </button>
            </div>
          </div>
        }

        <PurchaseDialog
          isOpen={isPurchaseDialogOpen}
          onClose={() => {
            setIsPurchaseDialogOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          userBalance={userBalance}
          onPurchaseComplete={handlePurchaseComplete} />

      </div>
    </section>);

};

export default ProductListing;