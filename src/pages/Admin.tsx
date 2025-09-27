import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Users, Package, DollarSign, TrendingUp, Eye, Edit, Plus, Search } from 'lucide-react';

interface UserInfo {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
  Roles: string;
}

interface AdminStats {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  active_products: number;
}

import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';

const Admin = () => {
  return (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>);

};

export default Admin;