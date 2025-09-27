import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  operator: string;
  category: string;
  logo: string;
  is_active: boolean;
  stock_quantity: number;
  validity_days: number;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'MMK',
    operator: '',
    category: '',
    logo: '',
    is_active: true,
    stock_quantity: 0,
    validity_days: 30,
    admin_notes: ''
  });

  const operators = ['MPT', 'OOREDOO', 'ATOM', 'MYTEL'];
  const categories = ['Data', 'Minutes', 'Points', 'Packages', 'Beautiful Numbers'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw new Error(error.message);
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
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
          target_type: 'product',
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

  // Create a workflow entry for product approvals/rejections
  const createProductWorkflow = async (
    productId: number,
    status: 'approved' | 'rejected',
    notes: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      await supabase.from('approval_workflows').insert({
        workflow_type: 'product',
        target_id: productId,
        status,
        admin_user_id: user?.id || null,
        admin_notes: notes,
        processed_at: now,
        created_at: now,
      });
    } catch (error) {
      console.warn('Failed to create product approval workflow:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsCreating(true);
      const now = new Date().toISOString();

        if (editingProduct) {
          // Update existing product
          const statusChanged = editingProduct.is_active !== formData.is_active;
          const { error } = await supabase
            .from('products')
            .update({
              ...formData,
              updated_at: now
            })
            .eq('id', editingProduct.id);

          if (error) throw new Error(error.message);

          // Record workflow if approval status changed
          if (statusChanged) {
            await createProductWorkflow(
              editingProduct.id,
              formData.is_active ? 'approved' : 'rejected',
              formData.admin_notes || `Status ${formData.is_active ? 'approved' : 'rejected'} by admin`
            );
          }

          await logAdminAction('update', editingProduct.id.toString(), `Updated product: ${formData.name}`, editingProduct, formData);

          toast({
            title: 'Success',
            description: 'Product updated successfully'
          });
        } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            ...formData,
            created_at: now,
            updated_at: now
          });

        if (error) throw new Error(error.message);

        await logAdminAction('create', 'new', `Created product: ${formData.name}`, null, formData);

        toast({
          title: 'Success',
          description: 'Product created successfully'
        });
      }

      setIsDialogOpen(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw new Error(error.message);

      await logAdminAction('delete', productId.toString(), `Deleted product: ${productName}`);

      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      });

      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const productId of selectedProducts) {
        const product = products.find((p) => p.id === productId);
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        
        if (error) throw new Error(error.message);
        await logAdminAction('bulk_delete', productId.toString(), `Bulk deleted product: ${product?.name}`);
      }

      toast({
        title: 'Success',
        description: `${selectedProducts.length} products deleted successfully`
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Failed to bulk delete products:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete products',
        variant: 'destructive'
      });
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    try {
      for (const productId of selectedProducts) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          const { error } = await supabase
            .from('products')
            .update({
              is_active: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);
          
          if (error) throw new Error(error.message);
          await logAdminAction('bulk_status_update', productId.toString(), `Bulk ${isActive ? 'activated' : 'deactivated'} product: ${product.name}`);

          // Create product approval workflow entry
          await createProductWorkflow(
            productId,
            isActive ? 'approved' : 'rejected',
            product?.admin_notes || `Bulk ${isActive ? 'activation' : 'deactivation'} by admin`
          );
        }
      }

      toast({
        title: 'Success',
        description: `${selectedProducts.length} products ${isActive ? 'activated' : 'deactivated'} successfully`
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'MMK',
      operator: '',
      category: '',
      logo: '',
      is_active: true,
      stock_quantity: 0,
      validity_days: 30,
      admin_notes: ''
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      operator: product.operator,
      category: product.category,
      logo: product.logo,
      is_active: product.is_active,
      stock_quantity: product.stock_quantity,
      validity_days: product.validity_days,
      admin_notes: product.admin_notes
    });
    setIsDialogOpen(true);
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
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <Package className="h-5 w-5 md:h-6 md:w-6" />
                <span>Product Management</span>
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Manage products, pricing, and availability</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base">
                    {editingProduct ? 'Update product information' : 'Add a new product to the catalog'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name (e.g. 5GB Data Pack)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (MMK)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ''}
                      placeholder="Enter price (e.g. 5000)"
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operator">Operator</Label>
                    <select
                      id="operator"
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Operator</option>
                      {operators.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity || ''}
                      placeholder="Enter stock quantity (e.g. 100)"
                      onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validity">Validity (Days)</Label>
                    <Input
                      id="validity"
                      type="number"
                      value={formData.validity_days || ''}
                      placeholder="Enter validity in days (e.g. 30)"
                      onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter detailed product description..."
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="admin-notes">Admin Notes</Label>
                    <Textarea
                      id="admin-notes"
                      value={formData.admin_notes}
                      onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                      placeholder="Internal notes for administrators (not visible to customers)..."
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
                    />
                    <Label htmlFor="active">Product is active and available for purchase</Label>
                  </div>
                </div>
                <DialogFooter className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full md:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isCreating} className="w-full md:w-auto">
                    {isCreating ? <LoadingSpinner size="sm" /> : null}
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Bulk Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus(true)}
                  className="w-full md:w-auto"
                >
                  Activate Selected ({selectedProducts.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus(false)}
                  className="w-full md:w-auto"
                >
                  Deactivate Selected ({selectedProducts.length})
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full md:w-auto">
                      Delete Selected ({selectedProducts.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {selectedProducts.length} selected products. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === filteredProducts.length}
                        onCheckedChange={(checked) =>
                          setSelectedProducts(
                            checked ? filteredProducts.map((p) => p.id) : []
                          )
                        }
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) =>
                            setSelectedProducts(
                              checked
                                ? [...selectedProducts, product.id]
                                : selectedProducts.filter((id) => id !== product.id)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.operator}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {product.price.toLocaleString()} {product.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          product.stock_quantity === 0 
                            ? 'text-red-600' 
                            : product.stock_quantity < 10 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.is_active ? 'default' : 'secondary'}
                          className={product.is_active ? 'bg-green-100 text-green-800' : ''}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id, product.name)}
                                >
                                  Delete
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
    </div>
  );
}