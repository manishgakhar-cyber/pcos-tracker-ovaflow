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
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAssessmentStatus(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAssessmentStatus(session.user.id);
      } else {
        setHasCompletedAssessment(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-purple-600">Loading...</div>
      </div>
    );
  }

  // Show assessment form if not completed OR if user wants to edit
  if (hasCompletedAssessment === false || showAssessmentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                {showAssessmentForm && hasCompletedAssessment && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAssessmentForm(false)}
                  >
                    ← Back to Dashboard
                  </Button>
                )}
              </div>
              <h1 className="text-4xl font-bold text-purple-800 flex-1">CycleWise</h1>
              <div className="flex-1 flex justify-end">
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
            <p className="text-purple-600">
              {showAssessmentForm && hasCompletedAssessment 
                ? 'Update your PCOS risk assessment' 
                : 'Complete your PCOS risk assessment to get started'}
            </p>
            {user && (
              <p className="text-sm text-purple-500 mt-1">{user.email}</p>
            )}
          </div>
          
          <PCOSAssessmentForm 
            onComplete={handleAssessmentComplete}
            isEdit={showAssessmentForm && hasCompletedAssessment === true}
          />
        </div>
      </div>
    );
  }

  // Show main app with tabs (without assessment tab)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1" />
            <h1 className="text-4xl font-bold text-purple-800 flex-1">CycleWise</h1>
            <div className="flex-1 flex justify-end">
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
          <p className="text-purple-600">Your comprehensive PCOS and cycle tracking companion</p>
          {user && (
            <p className="text-sm text-purple-500 mt-1">{user.email}</p>
          )}
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
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
      </div>
    </div>
  );
};

export default Index;
