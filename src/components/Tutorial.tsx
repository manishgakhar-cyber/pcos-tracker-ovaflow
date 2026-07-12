import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Activity, LineChart, BookOpen, X } from 'lucide-react';

interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to OvaFlow! 👋',
    description: 'Your comprehensive PCOS and cycle tracking companion. Let\'s take a quick tour of the features!',
    icon: <Activity className="w-12 h-12 text-purple-600 mx-auto" />,
  },
  {
    title: 'Dashboard Overview 📊',
    description: 'View your cycle day, next period prediction, PCOS risk score, and recent symptoms all in one place. Your health overview at a glance!',
    icon: <LineChart className="w-12 h-12 text-purple-600 mx-auto" />,
  },
  {
    title: 'Track Your Health 📝',
    description: 'Use the Tracker tab to log your period (with flow intensity) and symptoms separately. Choose a date and record how you\'re feeling each day.',
    icon: <Activity className="w-12 h-12 text-purple-600 mx-auto" />,
  },
  {
    title: 'Calendar View 🗓️',
    description: 'See your complete cycle history in the Calendar tab. Edit or delete previous entries, and visualize your patterns over time.',
    icon: <Calendar className="w-12 h-12 text-purple-600 mx-auto" />,
  },
  {
    title: 'Learn About PCOS 📚',
    description: 'Explore the Education tab for helpful information about PCOS, symptoms, management tips, and lifestyle recommendations.',
    icon: <BookOpen className="w-12 h-12 text-purple-600 mx-auto" />,
  },
];

export const Tutorial = ({ open, onClose }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip</span>
        </button>
        
        <DialogHeader>
          <div className="mb-4">{step.icon}</div>
          <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
