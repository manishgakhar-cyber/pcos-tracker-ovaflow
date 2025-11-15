-- Create reminder_settings table for period reminders
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  days_before INTEGER NOT NULL DEFAULT 3,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own reminder settings"
  ON public.reminder_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reminder settings"
  ON public.reminder_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reminder settings"
  ON public.reminder_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own reminder settings"
  ON public.reminder_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();