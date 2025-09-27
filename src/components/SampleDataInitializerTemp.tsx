import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function SampleDataInitializerTemp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5" />
          Sample Data Initializer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-white/70">
          <Database className="h-12 w-12 mx-auto mb-4 text-white/50" />
          <h3 className="text-lg font-medium mb-2">Database Initialization</h3>
          <p>This feature is being migrated to work with the new backend.</p>
        </div>
      </CardContent>
    </Card>
  );
}