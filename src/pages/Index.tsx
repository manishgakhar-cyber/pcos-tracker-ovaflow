
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

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
        
        <Tabs defaultValue="assessment" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessment">
            <PCOSAssessmentForm />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Dashboard />
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
