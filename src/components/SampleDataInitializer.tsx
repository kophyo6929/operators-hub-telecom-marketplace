import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Database, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SampleDataInitializer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);
  const { toast } = useToast();

  const sampleProducts = [
    // MPT Products
    {
      name: "1GB Data Pack",
      description: "High-speed internet for 30 days",
      price: 3000,
      currency: "MMK",
      operator: "MPT",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 1000,
      validity_days: 30,
      admin_notes: "Popular data package for casual users"
    },
    {
      name: "5GB Data Pack",
      description: "Extended data bundle for heavy users",
      price: 12000,
      currency: "MMK",
      operator: "MPT",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 500,
      validity_days: 30,
      admin_notes: "Best value data package"
    },
    {
      name: "100 Minutes Pack",
      description: "Talk time for local calls",
      price: 2500,
      currency: "MMK",
      operator: "MPT",
      category: "Minutes",
      logo: "",
      is_active: true,
      stock_quantity: 2000,
      validity_days: 30,
      admin_notes: "Basic voice package"
    },
    {
      name: "Combo Package",
      description: "2GB data + 50 minutes + 100 SMS",
      price: 8000,
      currency: "MMK",
      operator: "MPT",
      category: "Packages",
      logo: "",
      is_active: true,
      stock_quantity: 300,
      validity_days: 30,
      admin_notes: "Complete communication package"
    },

    // OOREDOO Products
    {
      name: "2GB SuperNet",
      description: "Fast 4G data for streaming",
      price: 5500,
      currency: "MMK",
      operator: "OOREDOO",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 800,
      validity_days: 30,
      admin_notes: "Premium streaming package"
    },
    {
      name: "10GB Ultimate",
      description: "Ultimate data experience",
      price: 20000,
      currency: "MMK",
      operator: "OOREDOO",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 100,
      validity_days: 30,
      admin_notes: "Power user package"
    },
    {
      name: "200 Minutes Plus",
      description: "Extended talk time package",
      price: 4500,
      currency: "MMK",
      operator: "OOREDOO",
      category: "Minutes",
      logo: "",
      is_active: true,
      stock_quantity: 1500,
      validity_days: 30,
      admin_notes: "Extended voice package"
    },
    {
      name: "09-123-456-789",
      description: "Premium number with easy pattern",
      price: 150000,
      currency: "MMK",
      operator: "OOREDOO",
      category: "Beautiful Numbers",
      logo: "",
      is_active: true,
      stock_quantity: 1,
      validity_days: 0,
      admin_notes: "Exclusive premium number"
    },

    // ATOM Products
    {
      name: "3GB Speed Pack",
      description: "Perfect for social media",
      price: 7000,
      currency: "MMK",
      operator: "ATOM",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 600,
      validity_days: 30,
      admin_notes: "Social media optimized"
    },
    {
      name: "1000 Reward Points",
      description: "Redeem for exclusive offers",
      price: 5000,
      currency: "MMK",
      operator: "ATOM",
      category: "Points",
      logo: "",
      is_active: true,
      stock_quantity: 2000,
      validity_days: 365,
      admin_notes: "Loyalty program credits"
    },
    {
      name: "09-888-888-888",
      description: "VIP number with lucky 8s",
      price: 500000,
      currency: "MMK",
      operator: "ATOM",
      category: "Beautiful Numbers",
      logo: "",
      is_active: true,
      stock_quantity: 1,
      validity_days: 0,
      admin_notes: "Ultra premium VIP number"
    },

    // MYTEL Products
    {
      name: "1.5GB Smart Pack",
      description: "Affordable data solution",
      price: 3500,
      currency: "MMK",
      operator: "MYTEL",
      category: "Data",
      logo: "",
      is_active: true,
      stock_quantity: 1200,
      validity_days: 30,
      admin_notes: "Budget-friendly data option"
    },
    {
      name: "150 Minutes Value",
      description: "Great value talk time",
      price: 3000,
      currency: "MMK",
      operator: "MYTEL",
      category: "Minutes",
      logo: "",
      is_active: true,
      stock_quantity: 1800,
      validity_days: 30,
      admin_notes: "Value voice package"
    },
    {
      name: "500 Bonus Points",
      description: "Loyalty rewards program",
      price: 2500,
      currency: "MMK",
      operator: "MYTEL",
      category: "Points",
      logo: "",
      is_active: true,
      stock_quantity: 3000,
      validity_days: 180,
      admin_notes: "Customer loyalty rewards"
    },
    {
      name: "Family Package",
      description: "5GB shared + unlimited family calls",
      price: 15000,
      currency: "MMK",
      operator: "MYTEL",
      category: "Packages",
      logo: "",
      is_active: true,
      stock_quantity: 200,
      validity_days: 30,
      admin_notes: "Family sharing package"
    }
  ];

  const checkProductCount = async () => {
    try {
      setIsChecking(true);
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) throw new Error(error.message);
      setProductCount(count || 0);
    } catch (error) {
      console.error('Failed to check product count:', error);
      toast({
        title: 'Error',
        description: 'Failed to check current products',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const insertSampleProducts = async () => {
    try {
      setIsLoading(true);
      const now = new Date().toISOString();
      let successCount = 0;
      let errorCount = 0;

      for (const product of sampleProducts) {
        try {
          const { error } = await supabase
            .from('products')
            .insert({
              ...product,
              created_at: now,
              updated_at: now
            });

          if (error) {
            console.error(`Failed to create product ${product.name}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error creating product ${product.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Sample Data Insertion Complete',
        description: `Successfully created ${successCount} products. ${errorCount} errors.`
      });

      // Refresh product count
      await checkProductCount();

    } catch (error) {
      console.error('Failed to insert sample products:', error);
      toast({
        title: 'Error',
        description: 'Failed to insert sample products',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkProductCount();
  }, []);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Initializer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Current Products</span>
          </div>
          {isChecking ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-blue-600">Checking...</span>
            </div>
          ) : (
            <span className="text-blue-600 font-semibold">
              {productCount} products in database
            </span>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-gray-600">
            This tool will insert {sampleProducts.length} sample telecom products into your database.
            These products include various data packs, minute bundles, and packages from all major Myanmar operators.
          </p>
          
          {productCount !== null && productCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-sm">
                ⚠️ Note: Products already exist in the database. Adding sample data may create duplicates.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={checkProductCount}
            variant="outline"
            disabled={isChecking}
          >
            {isChecking && <LoadingSpinner size="sm" className="mr-2" />}
            Refresh Count
          </Button>
          
          <Button
            onClick={insertSampleProducts}
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Insert Sample Products
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDataInitializer;