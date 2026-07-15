import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PCOSAssessmentForm } from '@/components/PCOSAssessmentForm';
import { PCOSResults } from '@/components/PCOSResults';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
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
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-pink-500 mr-3" />
            <h1 className="text-4xl font-bold text-purple-800">OvaFlow PCOS &amp; Cycle Tracking</h1>
          </div>
          <p className="text-xl text-purple-600 mb-2">Your comprehensive PCOS and cycle tracking companion</p>
          <p className="text-gray-600">Take a quick assessment to understand your PCOS risk</p>
          
          <div className="mt-4">
            <Button variant="link" onClick={() => navigate('/auth')} className="text-purple-600">
              Already have an account? Sign in
            </Button>
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
