import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Star, MessageSquare, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReferralFeedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const referralLink = window.location.origin;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Share CycleWise with your friends',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim() && rating === 0) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide a rating or written feedback',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, you'd save this to the database
    toast({
      title: 'Thank You!',
      description: 'Your feedback helps us improve CycleWise',
    });
    setFeedback('');
    setRating(0);
  };

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
        handleCopyLink();
      }
    } catch (error) {
      // User cancelled or share failed
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Referral Card */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Share2 className="w-5 h-5 mr-2" />
            Share CycleWise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Help other women take control of their health. Share CycleWise with friends who might benefit from tracking their cycle and PCOS symptoms.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={handleShare} className="flex-1" variant="default">
              <Share2 className="w-4 h-4 mr-2" />
              Share App
            </Button>
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Your referral link: <span className="font-mono">{referralLink}</span>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <MessageSquare className="w-5 h-5 mr-2" />
            Rate Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">How would you rate CycleWise?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium text-gray-700">
              Share your thoughts
            </label>
            <Textarea
              id="feedback"
              placeholder="What do you love? What could we improve?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{feedback.length}/500</p>
          </div>

          <Button onClick={handleSubmitFeedback} className="w-full">
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
