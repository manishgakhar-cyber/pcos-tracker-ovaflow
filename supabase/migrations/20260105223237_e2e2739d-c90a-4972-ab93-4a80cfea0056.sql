-- Create feedback table to store user ratings and feedback
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.user_feedback 
FOR DELETE 
USING (auth.uid() = user_id);