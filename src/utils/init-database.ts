import { supabase } from '@/integrations/supabase/client';
import { products } from '@/lib/products';

export const initializeSampleProducts = async () => {
  try {
    console.log('Initializing sample products...');

    // Check if products already exist
    const { data: existingProducts, error: checkError } = await supabase.
    from('products').
    select('id').
    limit(1);

    if (checkError) {
      throw checkError;
    }

    // If products exist, don't reinitialize
    if (existingProducts && existingProducts.length > 0) {
      console.log('Products already exist, skipping initialization');
      return { success: true, message: 'Products already initialized' };
    }

    // Convert products to database format
    const productsToInsert = products.map((product) => ({
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency || 'MMK',
      operator: product.operator,
      category: product.category,
      is_active: true,
      stock_quantity: 100,
      validity_days: 30,
      admin_notes: 'Sample product'
    }));

    // Insert products
    const { data, error } = await supabase.
    from('products').
    insert(productsToInsert).
    select();

    if (error) {
      throw error;
    }

    console.log('Sample products initialized successfully:', data?.length);
    return {
      success: true,
      message: `Successfully initialized ${data?.length || 0} products`
    };

  } catch (error) {
    console.error('Error initializing sample products:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const setupAdminUser = async (userEmail: string) => {
  try {
    console.log('Setting up admin user for:', userEmail);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    // Update user profile to mark as admin
    const { error: updateError } = await supabase.
    from('user_profiles').
    upsert({
      user_id: user.id,
      email: userEmail,
      full_name: user.user_metadata?.full_name || 'Admin User',
      credits_balance: 100000 // Give admin some credits for testing
    }, {
      onConflict: 'user_id'
    });

    if (updateError) {
      throw updateError;
    }

    return { success: true, message: 'Admin user setup complete' };
  } catch (error) {
    console.error('Error setting up admin user:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};