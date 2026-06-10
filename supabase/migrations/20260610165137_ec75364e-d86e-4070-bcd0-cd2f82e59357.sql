
-- Profiles: scope delete to authenticated
DROP POLICY IF EXISTS "Users can delete their profile" ON public.profiles;
CREATE POLICY "Users can delete their profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Reminder settings: scope all to authenticated
DROP POLICY IF EXISTS "Users view own reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Users insert own reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Users update own reminder settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Users delete own reminder settings" ON public.reminder_settings;

CREATE POLICY "Users view own reminder settings" ON public.reminder_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reminder settings" ON public.reminder_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reminder settings" ON public.reminder_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reminder settings" ON public.reminder_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User feedback: scope to authenticated and add update
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can create their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.user_feedback;

CREATE POLICY "Users can view their own feedback" ON public.user_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own feedback" ON public.user_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.user_feedback
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own feedback" ON public.user_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Revoke public execute on SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
