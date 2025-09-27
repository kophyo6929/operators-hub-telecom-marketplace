import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ isOpen, onClose, product }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Product
          </DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">Feature Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Purchase functionality is being migrated to work with the new backend.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;