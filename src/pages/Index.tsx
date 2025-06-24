
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PCOSAssessmentForm } from '@/components/PCOSAssessmentForm';
import { Dashboard } from '@/components/Dashboard';
import { SymptomTracker } from '@/components/SymptomTracker';
import { CycleCalendar } from '@/components/CycleCalendar';
import { Education } from '@/components/Education';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">CycleWise</h1>
          <p className="text-purple-600">Your comprehensive PCOS and cycle tracking companion</p>
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
