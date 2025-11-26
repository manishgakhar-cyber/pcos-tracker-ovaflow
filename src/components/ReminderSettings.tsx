import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingBag, Calendar, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomReminder {
  id: string;
  label: string;
  days_before: number;
  enabled: boolean;
}

export const ReminderSettings = () => {
  const [periodReminder, setPeriodReminder] = useState(true);
  const [shoppingReminder, setShoppingReminder] = useState(true);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [newReminderDays, setNewReminderDays] = useState('3');
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
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.length > 0) {
        // Separate built-in reminders from custom ones
        const builtInReminders = data.filter(r => !r.id.includes('custom_'));
        const customRems = data.filter(r => r.id.includes('custom_'));
        
        if (builtInReminders.length > 0) {
          setPeriodReminder(builtInReminders[0].enabled);
          setShoppingReminder(builtInReminders[0].days_before >= 3);
        }
        
        setCustomReminders(customRems.map(r => ({
          id: r.id,
          label: r.reminder_time, // Using reminder_time field to store label
          days_before: r.days_before,
          enabled: r.enabled
        })));
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
        .not('id', 'like', 'custom_%')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reminder_settings')
          .update(settings)
          .eq('id', existing.id);
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

  const handleAddCustomReminder = async () => {
    if (!newReminderLabel.trim() || !newReminderDays) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const customId = `custom_${Date.now()}`;
      const newReminder = {
        id: customId,
        user_id: user.id,
        enabled: true,
        days_before: parseInt(newReminderDays),
        reminder_time: newReminderLabel, // Store label in reminder_time field
      };

      const { error } = await supabase
        .from('reminder_settings')
        .insert(newReminder);

      if (error) throw error;

      setCustomReminders([...customReminders, {
        id: customId,
        label: newReminderLabel,
        days_before: parseInt(newReminderDays),
        enabled: true
      }]);

      setNewReminderLabel('');
      setNewReminderDays('3');

      toast({
        title: 'Success',
        description: 'Custom reminder added',
      });
    } catch (error) {
      console.error('Error adding custom reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reminder',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCustomReminder = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;

      setCustomReminders(customReminders.map(r => 
        r.id === id ? { ...r, enabled } : r
      ));

      toast({
        title: 'Reminder Updated',
        description: `Reminder ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating custom reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomReminders(customReminders.filter(r => r.id !== id));

      toast({
        title: 'Success',
        description: 'Reminder deleted',
      });
    } catch (error) {
      console.error('Error deleting custom reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reminder',
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
      <CardContent className="space-y-6">
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

        {/* Custom Reminders Section */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Custom Reminders
          </h4>
          
          {/* Add New Reminder Form */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Reminder name"
                value={newReminderLabel}
                onChange={(e) => setNewReminderLabel(e.target.value)}
                className="md:col-span-2"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Days"
                  value={newReminderDays}
                  onChange={(e) => setNewReminderDays(e.target.value)}
                  min="1"
                  max="30"
                  className="w-20"
                />
                <Button onClick={handleAddCustomReminder} size="sm" className="flex-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Reminders List */}
          <div className="space-y-2">
            {customReminders.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No custom reminders yet. Add one above!
              </p>
            ) : (
              customReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Bell className="w-4 h-4 text-blue-700" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {reminder.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {reminder.days_before} days before period
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={(checked) => handleToggleCustomReminder(reminder.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomReminder(reminder.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          All reminders are sent at 9:00 AM based on your cycle predictions
        </p>
      </CardContent>
    </Card>
  );
};
