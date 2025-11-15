import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, ShoppingBag, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ReminderSettings = () => {
  const [periodReminder, setPeriodReminder] = useState(true);
  const [shoppingReminder, setShoppingReminder] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPeriodReminder(data.enabled);
        // Use days_before to determine shopping reminder (if > 0, shopping is enabled)
        setShoppingReminder(data.days_before >= 3);
      }
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type: 'period' | 'shopping', value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === 'period') {
        setPeriodReminder(value);
      } else {
        setShoppingReminder(value);
      }

      const settings = {
        user_id: user.id,
        enabled: type === 'period' ? value : periodReminder,
        days_before: type === 'shopping' && value ? 3 : 0,
        reminder_time: '09:00:00',
      };

      const { data: existing } = await supabase
        .from('reminder_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reminder_settings')
          .update(settings)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reminder_settings')
          .insert(settings);
      }

      toast({
        title: 'Reminder Updated',
        description: `${type === 'period' ? 'Period' : 'Shopping'} reminder ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-purple-900">
          <Bell className="w-5 h-5 mr-2" />
          Smart Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Get helpful notifications to stay prepared
        </p>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-start gap-3 flex-1">
              <Calendar className="w-5 h-5 text-pink-700 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="period-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Period Arrival Alert
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Get notified 3 days before your expected period
                </p>
              </div>
            </div>
            <Switch
              id="period-reminder"
              checked={periodReminder}
              onCheckedChange={(checked) => handleToggle('period', checked)}
            />
          </div>

          <div className="flex items-start justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3 flex-1">
              <ShoppingBag className="w-5 h-5 text-purple-700 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="shopping-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Period Prep Reminder
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Reminder to stock up on pads, tampons, or pain relief
                </p>
              </div>
            </div>
            <Switch
              id="shopping-reminder"
              checked={shoppingReminder}
              onCheckedChange={(checked) => handleToggle('shopping', checked)}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          All reminders are sent at 9:00 AM based on your cycle predictions
        </p>
      </CardContent>
    </Card>
  );
};
