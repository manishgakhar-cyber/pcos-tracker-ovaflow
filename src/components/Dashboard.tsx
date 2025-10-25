
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, AlertTriangle, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { differenceInDays, addDays } from 'date-fns';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch most recent cycle data
      const { data: cycles } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start_date', { ascending: false })
        .limit(1);

      // Fetch PCOS assessment
      const { data: assessment } = await supabase
        .from('pcos_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Fetch recent symptoms (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('log_date', { ascending: false });

      setCycleData(cycles?.[0] || null);
      setRiskData(assessment?.[0] || null);
      
      // Extract unique symptoms from recent logs
      const uniqueSymptoms = new Set<string>();
      symptoms?.forEach(log => {
        log.symptoms?.forEach((s: string) => uniqueSymptoms.add(s));
      });
      setRecentSymptoms(Array.from(uniqueSymptoms));
      
      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // Calculate cycle metrics
  const cycleDay = cycleData 
    ? differenceInDays(new Date(), new Date(cycleData.period_start_date)) + 1 
    : null;
  const cycleLength = cycleData?.cycle_length || null;
  const nextPeriodDate = cycleData && cycleLength
    ? addDays(new Date(cycleData.period_start_date), cycleLength)
    : null;
  const nextPeriod = nextPeriodDate
    ? `${differenceInDays(nextPeriodDate, new Date())} days`
    : null;

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'bg-green-500' };
    if (score < 60) return { level: 'Moderate', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  const riskScore = riskData?.risk_score || null;
  const riskLevel = riskScore ? getRiskLevel(riskScore) : null;

  const hasAnyData = cycleData || riskData || recentSymptoms.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600">
          {hasAnyData ? "Here's your health overview" : "Start tracking to see your health insights"}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-100 to-pink-50 border-pink-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Cycle Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cycleDay && cycleLength ? (
              <>
                <div className="text-2xl font-bold text-pink-900">
                  Day {cycleDay}
                </div>
                <p className="text-sm text-pink-600">of {cycleLength}-day cycle</p>
              </>
            ) : (
              <div className="text-sm text-pink-600">No cycle data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              Next Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextPeriod ? (
              <>
                <div className="text-2xl font-bold text-purple-900">
                  {nextPeriod}
                </div>
                <p className="text-sm text-purple-600">Expected date</p>
              </>
            ) : (
              <div className="text-sm text-purple-600">No cycle data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              PCOS Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskScore && riskLevel ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-blue-900">
                    {riskScore}%
                  </div>
                  <Badge variant="secondary" className={`${riskLevel.color} text-white`}>
                    {riskLevel.level}
                  </Badge>
                </div>
                <Progress value={riskScore} className="mt-2" />
              </>
            ) : (
              <div className="text-sm text-blue-600">Assessment completed</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Active Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {recentSymptoms.length}
            </div>
            <p className="text-sm text-orange-600">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Recent Symptoms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSymptoms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentSymptoms.map((symptom, index) => (
                <Badge key={index} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                  {symptom}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No symptoms logged this week</p>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {!hasAnyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">Track your symptoms daily to identify patterns</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">Log your cycle information in the Calendar tab</p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">Check back regularly to see personalized health insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
