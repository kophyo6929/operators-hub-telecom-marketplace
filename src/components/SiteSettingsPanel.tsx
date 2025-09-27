import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, DollarSign, Mail, MessageCircle, Phone, Save, Loader2 } from 'lucide-react';

interface SiteSettings {
  id: number;
  kpay_account_name: string;
  kpay_account_number: string;
  wave_pay_account_name: string;
  wave_pay_account_number: string;
  support_email: string;
  support_telegram: string;
  support_phone: string;
  credit_rate_mmk: number;
}

const SiteSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          await createDefaultSettings();
          return;
        }
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch site settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .insert([{
          id: 1,
          kpay_account_name: 'Hlaing Ko Phyo',
          kpay_account_number: '09883249943',
          wave_pay_account_name: 'Hlaing Ko Phyo',
          wave_pay_account_number: '09883249943',
          support_email: 'thewayofthedragg@gmail.com',
          support_telegram: 'https://t.me/CEO_METAVERSE',
          support_phone: '09789037037',
          credit_rate_mmk: 100
        }])
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Failed to create default settings:', error);
      toast({
        title: "Error",
        description: "Failed to create default settings",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          kpay_account_name: settings.kpay_account_name,
          kpay_account_number: settings.kpay_account_number,
          wave_pay_account_name: settings.wave_pay_account_name,
          wave_pay_account_number: settings.wave_pay_account_number,
          support_email: settings.support_email,
          support_telegram: settings.support_telegram,
          support_phone: settings.support_phone,
          credit_rate_mmk: settings.credit_rate_mmk,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Site settings have been updated successfully"
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof SiteSettings, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load settings</p>
            <Button onClick={fetchSettings} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Site Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Payment Credentials</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* K Pay Settings */}
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-blue-800">K Pay Account</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="kpay_name">Account Name</Label>
                    <Input
                      id="kpay_name"
                      value={settings.kpay_account_name}
                      onChange={(e) => updateSetting('kpay_account_name', e.target.value)}
                      placeholder="Enter K Pay account name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="kpay_number">Account Number</Label>
                    <Input
                      id="kpay_number"
                      value={settings.kpay_account_number}
                      onChange={(e) => updateSetting('kpay_account_number', e.target.value)}
                      placeholder="Enter K Pay phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wave Pay Settings */}
            <Card className="border-yellow-200">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-yellow-800">Wave Pay Account</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="wave_name">Account Name</Label>
                    <Input
                      id="wave_name"
                      value={settings.wave_pay_account_name}
                      onChange={(e) => updateSetting('wave_pay_account_name', e.target.value)}
                      placeholder="Enter Wave Pay account name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wave_number">Account Number</Label>
                    <Input
                      id="wave_number"
                      value={settings.wave_pay_account_number}
                      onChange={(e) => updateSetting('wave_pay_account_number', e.target.value)}
                      placeholder="Enter Wave Pay phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Support Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Support Credentials</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="support_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Support Email
              </Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => updateSetting('support_email', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div>
              <Label htmlFor="support_telegram" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Telegram Link
              </Label>
              <Input
                id="support_telegram"
                value={settings.support_telegram}
                onChange={(e) => updateSetting('support_telegram', e.target.value)}
                placeholder="https://t.me/username"
              />
            </div>
            <div>
              <Label htmlFor="support_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Support Phone
              </Label>
              <Input
                id="support_phone"
                value={settings.support_phone}
                onChange={(e) => updateSetting('support_phone', e.target.value)}
                placeholder="09xxxxxxxxx"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* System Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">System Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credit_rate">Credit Rate (MMK per Credit)</Label>
              <Input
                id="credit_rate"
                type="number"
                min="1"
                value={settings.credit_rate_mmk}
                onChange={(e) => updateSetting('credit_rate_mmk', parseInt(e.target.value) || 100)}
                placeholder="100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current rate: 1 Credit = {settings.credit_rate_mmk} MMK
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteSettingsPanel;