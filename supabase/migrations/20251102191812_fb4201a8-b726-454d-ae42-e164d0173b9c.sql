-- Add DELETE policy for profiles table to allow user self-deletion (GDPR compliance)
CREATE POLICY "Users can delete their profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);