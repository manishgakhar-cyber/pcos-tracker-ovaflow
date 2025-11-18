
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Heart, Moon, Sparkles, Sun, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { computeCycleInsights } from '@/lib/cycleUtils';
import { ReminderSettings } from './ReminderSettings';
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

      // Compute cycle insights
      const insights = computeCycleInsights(cycles || []);
      
      setCycleData(insights);
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

  const currentPhase = getCyclePhase(cycleData?.cycleDay, cycleData?.avgCycleLength);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-h-screen">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse shadow-card">
              <CardHeader><div className="h-4 bg-muted rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-24 bg-muted/50 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Hero Cycle Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Current Cycle Day */}
            <Card className="relative overflow-hidden shadow-card border-2 hover:shadow-soft transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">Current Cycle Day</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {cycleData?.cycleDay !== null ? `Day ${cycleData.cycleDay}` : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {cycleData?.avgCycleLength ? `of ${cycleData.avgCycleLength}-day cycle` : 'Track your period to see insights'}
                </p>
              </CardContent>
            </Card>

            {/* Next Period Prediction */}
            <Card className="relative overflow-hidden shadow-card border-2 hover:shadow-soft transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">Next Period</CardTitle>
                <div className="p-2 rounded-full bg-secondary/10">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  {cycleData?.nextPeriodDate
                    ? new Date(cycleData.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {cycleData?.daysUntilNextPeriod !== null
                    ? `in ${cycleData.daysUntilNextPeriod} days`
                    : 'Need more cycle data'}
                </p>
              </CardContent>
            </Card>

            {/* PCOS Risk Assessment */}
            <Card className="relative overflow-hidden shadow-card border-2 hover:shadow-soft transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">PCOS Risk</CardTitle>
                <div className="p-2 rounded-full bg-accent/10">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                {riskData ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">
                        {riskData.risk_score}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">/100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className="shadow-sm"
                        variant={
                          riskData.risk_level === 'High'
                            ? 'destructive'
                            : riskData.risk_level === 'Moderate'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {riskData.risk_level} Risk
                      </Badge>
                    </div>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={onEditAssessment} className="mt-2">
                    Take Assessment
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cycle Phase Insights */}
          {currentPhase && (
            <Card className={`border-2 shadow-card ${currentPhase.bgColor} overflow-hidden relative`}>
              <div className="absolute top-0 right-0 w-64 h-64 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white/50 ${currentPhase.color}`}>
                    {currentPhase.icon}
                  </div>
                  <span className="text-xl">{currentPhase.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <p className="text-sm text-foreground/80 font-medium">{currentPhase.description}</p>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Recommendations:
                  </p>
                  <ul className="space-y-2">
                    {currentPhase.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className={`mt-1 font-bold ${currentPhase.color}`}>✓</span>
                        <span className="text-foreground/90">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Recent Symptoms */}
            <Card className="shadow-card border-2 hover:shadow-soft transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  Recent Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSymptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentSymptoms.map((symptom, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="shadow-sm px-3 py-1"
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent symptoms logged</p>
                )}
              </CardContent>
            </Card>

            {/* Cycle Progress */}
            <Card className="shadow-card border-2 hover:shadow-soft transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  Cycle Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cycleData?.cycleDay && cycleData?.avgCycleLength ? (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-3 font-medium">
                        <span className="text-primary">Day {cycleData.cycleDay}</span>
                        <span className="text-muted-foreground">of {cycleData.avgCycleLength}</span>
                      </div>
                      <Progress 
                        value={(cycleData.cycleDay / cycleData.avgCycleLength) * 100}
                        className="h-3"
                      />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground">
                        {cycleData.daysUntilNextPeriod !== null &&
                          `${cycleData.daysUntilNextPeriod} days until next period`}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Start tracking to see progress</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <ReminderSettings />
            <ReferralFeedback />
          </div>
        </>
      )}
    </div>
  );
};
