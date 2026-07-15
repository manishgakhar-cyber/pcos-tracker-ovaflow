import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PCOSAssessmentForm } from '@/components/PCOSAssessmentForm';
import { PCOSResults } from '@/components/PCOSResults';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, CalendarHeart, LineChart } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Welcome = () => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    // Listen for auth changes (fires after email confirmation link hydrates the session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          navigate('/dashboard', { replace: true });
        } else {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAssessmentComplete = (data: any) => {
    setAssessmentData(data);
    setShowResults(true);
    try {
      localStorage.setItem('ovaflow_assessment_completed', 'true');
      localStorage.setItem('ovaflow_guest_assessment', JSON.stringify(data));
    } catch {}
  };

  const handleSignUpPrompt = () => {
    navigate('/auth?tab=signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-purple-600">Loading...</div>
      </div>
    );
  }

  if (showResults && assessmentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <PCOSResults 
          assessmentData={assessmentData}
          onRetakeAssessment={() => {
            setShowResults(false);
            setAssessmentData(null);
          }}
          onComplete={handleSignUpPrompt}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Helmet>
        <title>OvaFlow PCOS and Cycle Tracking Companion</title>
        <meta name="description" content="Take a free PCOS risk assessment and start tracking your cycle, symptoms, and hormonal health with OvaFlow." />
        <link rel="canonical" href="/" />
        <meta property="og:title" content="OvaFlow PCOS and Cycle Tracking Companion" />
        <meta property="og:description" content="Take a free PCOS risk assessment and start tracking your cycle." />
        <meta property="og:url" content="/" />
      </Helmet>
      <main className="container mx-auto px-4 pt-6 pb-8">
        {/* Landing header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-pink-500" />
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              OvaFlow
            </h1>
          </div>
          <p className="text-base sm:text-lg text-purple-800 font-medium max-w-xl mx-auto leading-snug">
            Quick PCOS check, then track your cycle and symptoms.
          </p>
          <Button
            variant="link"
            onClick={() => navigate('/auth')}
            className="text-purple-600 mt-1"
          >
            Already have an account? Sign in
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-purple-800">PCOS Risk Check</p>
            <p className="text-xs text-gray-600 leading-tight">Personalized insights in minutes</p>
          </div>
          <div className="text-center">
            <CalendarHeart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-purple-800">Period Tracking</p>
            <p className="text-xs text-gray-600 leading-tight">Log cycles and predict the next one</p>
          </div>
          <div className="text-center">
            <LineChart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-purple-800">Symptom Insights</p>
            <p className="text-xs text-gray-600 leading-tight">Spot patterns in your hormonal health</p>
          </div>
        </div>

        <PCOSAssessmentForm
          onComplete={handleAssessmentComplete}
          guestMode={true}
        />
      </main>
    </div>
  );
};

export default Welcome;
