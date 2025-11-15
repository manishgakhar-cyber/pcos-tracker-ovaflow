import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReferralFeedback = () => {
  const { toast } = useToast();
  
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

  return (
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
            <Button onClick={() => {
              const rating = window.prompt('Rate CycleWise (1-5 stars):');
              const feedback = window.prompt('Share your feedback (optional):');
              if (rating) {
                toast({
                  title: 'Thank You!',
                  description: 'Your feedback helps us improve',
                });
              }
            }} size="sm" variant="outline">
              <Star className="w-3 h-3 mr-1.5" />
              Rate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
