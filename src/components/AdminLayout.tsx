import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BarChart3, Users, Package, CheckSquare, Shield, ArrowLeft, Zap, Menu, CreditCard, ShoppingCart, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminDashboard from '@/components/AdminDashboard';
import ProductManagement from '@/components/ProductManagement';
import UserManagement from '@/components/UserManagement';
import PaymentRequestManagement from '@/components/PaymentRequestManagement';
import PendingOrdersManagement from '@/components/PendingOrdersManagement';
import ApprovalWorkflows from '@/components/ApprovalWorkflows';
import SiteSettingsPanel from '@/components/SiteSettingsPanel';

type TabValue = 'dashboard' | 'products' | 'users' | 'payments' | 'orders' | 'approvals' | 'settings';

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  component: React.ComponentType;
}

const navItems: NavItem[] = [
{ value: 'dashboard', label: 'Dashboard', icon: BarChart3, component: AdminDashboard },
{ value: 'products', label: 'Products', icon: Package, component: ProductManagement },
{ value: 'users', label: 'Users', icon: Users, component: UserManagement },
{ value: 'payments', label: 'Payment Requests', icon: CreditCard, component: PaymentRequestManagement },
{ value: 'orders', label: 'Pending Orders', icon: ShoppingCart, component: PendingOrdersManagement },
{ value: 'approvals', label: 'Approvals', icon: CheckSquare, component: ApprovalWorkflows },
{ value: 'settings', label: 'Site Settings', icon: Settings, component: SiteSettingsPanel }];


export default function AdminLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value);
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  const ActiveComponent = navItems.find((item) => item.value === activeTab)?.component || AdminDashboard;

  return (
    <div className="min-h-screen mesh-gradient relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>

      <div className="relative z-10">
        {/* Header with back button and mobile menu */}
        <div className="glass-card border-b border-white/10 px-4 md:px-6 py-4 mx-2 md:mx-4 mt-2 md:mt-4 rounded-t-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center space-x-1 md:space-x-2">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isMobile &&
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="sm"
                    className="glass-card hover:bg-white/10 border-white/20 text-white hover:text-amber-400 transition-colors p-2">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 glass-card border-white/10">
                    <SheetHeader>
                      <SheetTitle className="text-white flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-amber-400" />
                        <Shield className="h-6 w-6 text-white" />
                        <span>Admin Panel</span>
                      </SheetTitle>
                      <SheetDescription className="text-white/70">
                        Navigate between admin sections
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 space-y-2">
                      {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          onClick={() => handleTabChange(item.value)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                          activeTab === item.value ?
                          'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-black' :
                          'text-white/70 hover:text-white hover:bg-white/10'}`
                          }>
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </button>);

                    })}
                    </div>
                  </SheetContent>
                </Sheet>
              }
              <Button
                onClick={handleBack}
                variant="outline"
                size="sm"
                className="glass-card hover:bg-white/10 border-white/20 text-white hover:text-amber-400 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Back to Site</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-2 md:px-6 pb-6">
          {isMobile ?
          // Mobile: Single active component
          <div className="space-y-4 md:space-y-6">
              {/* Mobile navigation breadcrumb */}
              <div className="glass-card rounded-2xl px-4 py-3 mx-2">
                <div className="flex items-center space-x-2 text-white">
                  {(() => {
                  const activeItem = navItems.find((item) => item.value === activeTab);
                  const Icon = activeItem?.icon || BarChart3;
                  return (
                    <>
                        <Icon className="h-5 w-5 text-amber-400" />
                        <span className="font-medium">{activeItem?.label}</span>
                      </>);

                })()}
                </div>
              </div>
              
              <div className="px-2">
                <ActiveComponent />
              </div>
            </div> :

          // Desktop: Tabs interface
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-6 mt-6">
              <div className="glass-card rounded-2xl p-1">
                <TabsList className="grid w-full grid-cols-7 bg-transparent border-none">
                  {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-400 data-[state=active]:to-yellow-400 data-[state=active]:text-black text-white/70 hover:text-white transition-all rounded-xl min-h-[44px] bg-[#040406] text-white">
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </TabsTrigger>);

                })}
                </TabsList>
              </div>

              {navItems.map((item) =>
            <TabsContent key={item.value} value={item.value}>
                  <item.component />
                </TabsContent>
            )}
            </Tabs>
          }
        </div>
      </div>
    </div>);

}