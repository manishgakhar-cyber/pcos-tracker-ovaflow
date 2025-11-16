import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});

export const ReferralFeedback = () => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [rating, setRating] = useState<string>('5');
  const [feedback, setFeedback] = useState('');
  
  const referralLink = window.location.origin;

  const handleShare = async () => {
    const shareData = {
      title: 'CycleWise - PCOS & Cycle Tracking',
      text: 'Check out CycleWise - a comprehensive PCOS and cycle tracking app!',
      url: referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(referralLink);
        toast({
          title: 'Link Copied!',
          description: 'Share CycleWise with your friends',
        });
      }
    } catch (error) {
      // User cancelled or share failed
    }
  };

  const handleSubmitFeedback = () => {
    try {
      const validatedData = feedbackSchema.parse({
        rating: parseInt(rating),
        feedback: feedback.trim() || undefined,
      });
      
      toast({
        title: 'Thank You!',
        description: 'Your feedback helps us improve',
      });
      
      setShowDialog(false);
      setRating('5');
      setFeedback('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Invalid Input',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-purple-900 flex items-center text-sm">
                <Share2 className="w-4 h-4 mr-1.5" />
                Share & Feedback
              </h3>
              <p className="text-xs text-gray-600">Help others discover CycleWise or share your thoughts</p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleShare} size="sm" variant="outline">
                <Share2 className="w-3 h-3 mr-1.5" />
                Share
              </Button>
              <Button onClick={() => setShowDialog(true)} size="sm" variant="outline">
                <Star className="w-3 h-3 mr-1.5" />
                Rate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate CycleWise</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve the app for everyone
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <RadioGroup value={rating} onValueChange={setRating}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r1" />
                  <Label htmlFor="r1">1 - Poor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2" />
                  <Label htmlFor="r2">2 - Fair</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="r3" />
                  <Label htmlFor="r3">3 - Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="r4" />
                  <Label htmlFor="r4">4 - Very Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="r5" />
                  <Label htmlFor="r5">5 - Excellent</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {feedback.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
