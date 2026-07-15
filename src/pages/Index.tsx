import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PCOSAssessmentForm } from '@/components/PCOSAssessmentForm';
import { Dashboard } from '@/components/Dashboard';
import { SymptomTracker } from '@/components/SymptomTracker';
import { CycleCalendar } from '@/components/CycleCalendar';
import { Education } from '@/components/Education';
import { Tutorial } from '@/components/Tutorial';
import type { User } from '@supabase/supabase-js';
import { Helmet } from 'react-helmet-async';
import ovaflowLogo from '@/assets/ovaflow-logo.png.asset.json';

const TUTORIAL_KEY = 'cyclewise_tutorial_completed';
const GUEST_ASSESSMENT_KEY = 'ovaflow_guest_assessment';

const persistGuestAssessmentIfAny = async (userId: string) => {
  try {
    const raw = localStorage.getItem(GUEST_ASSESSMENT_KEY);
    if (!raw) return false;
    const formData = JSON.parse(raw);

    const assessmentPayload = {
      age: Number(formData.age),
      height: formData.height ? Number(formData.height) : 0,
      weight: formData.weight ? Number(formData.weight) : 0,
      ethnicity: formData.ethnicity,
      periodFrequency: formData.periodFrequency,
      cycleLength: Number(formData.cycleLength),
      flowIntensity: formData.flowIntensity,
      symptoms: formData.symptoms,
      acneSeverity: formData.acneSeverity,
      hairGrowth: formData.hairGrowth,
      hairLoss: formData.hairLoss,
      weightChanges: formData.weightChanges,
      moodSymptoms: formData.moodSymptoms,
      familyHistory: formData.familyHistory,
      medications: formData.medications,
      additionalNotes: formData.additionalNotes,
    };

    let riskScore = 0;
    let riskLevel = 'low';
    try {
      const { data: analysisData } = await supabase.functions.invoke(
        'analyze-pcos-assessment',
        { body: { assessmentData: assessmentPayload } }
      );
      if (analysisData) {
        riskScore = analysisData.riskScore ?? 0;
        riskLevel = analysisData.riskLevel ?? 'low';
      }
    } catch (e) {
      console.error('AI analysis failed, saving assessment without score', e);
    }

    const { error: insertError } = await supabase
      .from('pcos_assessments')
      .insert([{
        user_id: userId,
        assessment_data: formData as any,
        risk_score: riskScore,
        risk_level: riskLevel,
      }]);

    if (insertError) {
      console.error('Failed to persist guest assessment', insertError);
      return false;
    }

    localStorage.removeItem(GUEST_ASSESSMENT_KEY);
    return true;
  } catch (e) {
    console.error('persistGuestAssessmentIfAny error', e);
    return false;
  }
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserName(session.user.id);
        await persistGuestAssessmentIfAny(session.user.id);
        await checkAssessmentStatus(session.user.id);
        
        // Check if user has seen tutorial
        const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
        if (!tutorialCompleted) {
          setShowTutorial(true);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserName(session.user.id);
        await persistGuestAssessmentIfAny(session.user.id);
        await checkAssessmentStatus(session.user.id);
        
        // Check if user has seen tutorial
        const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
        if (!tutorialCompleted) {
          setShowTutorial(true);
        }
      } else {
        setUserName('');
        setHasCompletedAssessment(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserName = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data?.first_name) {
        const fullName = data.last_name 
          ? `${data.first_name} ${data.last_name}`
          : data.first_name;
        setUserName(fullName);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const checkAssessmentStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pcos_assessments')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;
      
      setHasCompletedAssessment(data && data.length > 0);
    } catch (error) {
      console.error('Error checking assessment status:', error);
      setHasCompletedAssessment(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessmentComplete = async () => {
    if (user) {
      await checkAssessmentStatus(user.id);
      setShowAssessmentForm(false);
    }
  };

  const handleEditAssessment = () => {
    setShowAssessmentForm(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCloseTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-purple-600">Loading...</div>
      </div>
    );
  }

  // Show assessment form only when the user explicitly chooses to edit/retake it.
  if (showAssessmentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <Helmet>
          <title>PCOS Assessment OvaFlow</title>
          <meta name="description" content="Complete your PCOS risk assessment to unlock personalized cycle tracking and insights on OvaFlow." />
          <link rel="canonical" href="/dashboard" />
          <meta property="og:title" content="PCOS Assessment OvaFlow" />
          <meta property="og:url" content="/dashboard" />
        </Helmet>
        <header className="sticky top-0 z-40 bg-gradient-to-br from-pink-50 to-purple-50/95 backdrop-blur border-b border-purple-100">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
            {showAssessmentForm && hasCompletedAssessment ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssessmentForm(false)}
                className="shrink-0"
              >
                ← Back
              </Button>
            ) : (
              <div className="w-16" />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <img src={ovaflowLogo.url} alt="OvaFlow logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent truncate">
                OvaFlow
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4">
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-1">
              PCOS Assessment
            </h2>
            <p className="text-purple-600 text-sm">
              {showAssessmentForm && hasCompletedAssessment 
                ? 'Update your PCOS risk assessment' 
                : 'Complete your PCOS risk assessment to get started'}
            </p>
            {userName && (
              <p className="text-xs text-purple-500 mt-1">Hi, {userName}!</p>
            )}
          </div>
          
          <PCOSAssessmentForm 
            onComplete={handleAssessmentComplete}
            isEdit={showAssessmentForm && hasCompletedAssessment === true}
          />
        </main>
      </div>
    );
  }

  // Show main app with tabs (without assessment tab)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Helmet>
        <title>Dashboard OvaFlow</title>
        <meta name="description" content="Your OvaFlow dashboard: track cycles, log symptoms, view predictions, and learn about PCOS." />
        <link rel="canonical" href="/dashboard" />
        <meta property="og:title" content="Dashboard OvaFlow" />
        <meta property="og:url" content="/dashboard" />
      </Helmet>
      <Tutorial open={showTutorial} onClose={handleCloseTutorial} />

      <header className="sticky top-0 z-40 bg-gradient-to-br from-pink-50 to-purple-50/95 backdrop-blur border-b border-purple-100">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <img src={ovaflowLogo.url} alt="OvaFlow logo" className="w-11 h-11 sm:w-14 sm:h-14 rounded-full shrink-0" />
            <div className="min-w-0 leading-tight">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent truncate">
                OvaFlow
              </h1>
              {userName && (
                <p className="text-xs text-purple-500 truncate">Hi, {userName}!</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Dashboard onEditAssessment={handleEditAssessment} />
          </TabsContent>
          
          <TabsContent value="tracker">
            <SymptomTracker />
          </TabsContent>
          
          <TabsContent value="calendar">
            <CycleCalendar />
          </TabsContent>
          
          <TabsContent value="education">
            <Education />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
