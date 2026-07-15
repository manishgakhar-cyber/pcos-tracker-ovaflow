
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, AlertTriangle, Heart, Moon, Sparkles, Sun, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { computeCycleInsights } from '@/lib/cycleUtils';
import { computeLocalRisk } from '@/lib/pcosRisk';
import { ReferralFeedback } from './ReferralFeedback';

type CyclePhase = {
  name: string;
  description: string;
  recommendations: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
};

const getCyclePhase = (cycleDay: number | null, cycleLength: number | null): CyclePhase | null => {
  if (!cycleDay || !cycleLength) return null;

  // Menstrual Phase (Days 1-5)
  if (cycleDay <= 5) {
    return {
      name: 'Menstrual Phase',
      description: 'Your body is shedding the uterine lining',
      recommendations: [
        'Rest and prioritize self-care',
        'Stay hydrated and eat iron-rich foods',
        'Light exercise like walking or gentle yoga',
        'Use heat therapy for cramps'
      ],
      icon: <Droplets className="w-5 h-5" />,
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-br from-red-100 to-red-50 border-red-200'
    };
  }

  // Calculate ovulation day (typically 14 days before next period)
  const ovulationDay = cycleLength - 14;
  
  // Ovulation Phase (3 days around ovulation)
  if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) {
    return {
      name: 'Ovulation Phase',
      description: 'Peak fertility window - ovulation occurring',
      recommendations: [
        'Most fertile time of your cycle',
        'Energy levels typically highest',
        'Great time for important tasks',
        'Monitor for ovulation symptoms'
      ],
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-yellow-700',
      bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200'
    };
  }

  // Follicular Phase (After period, before ovulation)
  if (cycleDay > 5 && cycleDay < ovulationDay - 1) {
    return {
      name: 'Follicular Phase',
      description: 'Your body is preparing for ovulation',
      recommendations: [
        'Energy and mood typically improving',
        'Good time for new projects',
        'Focus on strength training',
        'Skin may be clearer'
      ],
      icon: <Sun className="w-5 h-5" />,
      color: 'text-green-700',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-50 border-green-200'
    };
  }

  // Luteal Phase (After ovulation, before next period)
  return {
    name: 'Luteal Phase',
    description: 'Your body is preparing for menstruation',
    recommendations: [
      'PMS symptoms may begin',
      'Prioritize stress management',
      'Eat balanced meals to stabilize mood',
      'Get adequate sleep'
    ],
    icon: <Moon className="w-5 h-5" />,
    color: 'text-indigo-700',
    bgColor: 'bg-gradient-to-br from-indigo-100 to-indigo-50 border-indigo-200'
  };
};

export const Dashboard = ({ onEditAssessment }: { onEditAssessment?: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all cycle data to calculate properly
      const { data: cycles } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start_date', { ascending: false });

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

      setCycleData(cycles || []);
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

  // Calculate cycle metrics using robust algorithm (derived from start dates)
  const metrics = computeCycleInsights(Array.isArray(cycleData) ? cycleData : []);
  const cycleDay = metrics.cycleDay;
  const cycleLength = metrics.avgCycleLength;
  const nextPeriod = metrics.nextPeriodLabel;
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'bg-green-500' };
    if (score < 60) return { level: 'Moderate', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  // Prefer stored risk score; if missing/zero, compute locally from the raw
  // assessment data so the dashboard always reflects the user's answers.
  let riskScore: number | null = null;
  if (riskData?.risk_score && riskData.risk_score > 0) {
    riskScore = riskData.risk_score;
  } else if (riskData?.assessment_data) {
    riskScore = computeLocalRisk(riskData.assessment_data).riskScore;
  }
  const riskLevel = riskScore !== null ? getRiskLevel(riskScore) : null;

  const hasAnyData = (Array.isArray(cycleData) && cycleData.length > 0) || riskData || recentSymptoms.length > 0;
  
  const currentPhase = getCyclePhase(cycleDay, cycleLength);

  return (
    <div className="space-y-6">
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
            {cycleDay !== null ? (
              <>
                {cycleLength && cycleDay > cycleLength + 3 ? (
                  <>
                    <div className="text-lg font-bold text-pink-900 flex items-center gap-1">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Period may be late
                    </div>
                    <p className="text-sm text-pink-600 mt-1">
                      Have you recorded your last period? You may be {cycleDay - cycleLength} days late.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-pink-900">
                      Day {cycleDay}
                    </div>
                    <p className="text-sm text-pink-600">{cycleLength ? `of ${cycleLength}-day cycle` : 'Estimating cycle length'}</p>
                  </>
                )}
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

      {/* Cycle Phase Information */}
      {currentPhase && (
        <Card className={currentPhase.bgColor}>
          <CardHeader>
            <CardTitle className={`flex items-center ${currentPhase.color}`}>
              {currentPhase.icon}
              <span className="ml-2">{currentPhase.name}</span>
              <Badge variant="secondary" className="ml-auto">
                Day {cycleDay}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={`text-sm font-medium ${currentPhase.color}`}>
              {currentPhase.description}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Recommendations:</p>
              <ul className="space-y-1">
                {currentPhase.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-600">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Referral & Feedback */}
      <ReferralFeedback />

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

      {/* Edit Assessment Option */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">Need to update your assessment?</h3>
              <p className="text-sm text-gray-600">Retake your PCOS risk assessment if your symptoms have changed</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onEditAssessment}
              className="ml-4"
            >
              Edit Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
