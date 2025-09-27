import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export function PaymentRequestManagementTemp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5" />
          Payment Request Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-white/70">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-white/50" />
          <h3 className="text-lg font-medium mb-2">Payment Request Management</h3>
          <p>This feature is being migrated to work with the new backend.</p>
        </div>
      </CardContent>
    </Card>
  );
}