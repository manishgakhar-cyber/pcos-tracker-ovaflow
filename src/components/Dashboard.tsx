
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, AlertTriangle, Heart } from 'lucide-react';

export const Dashboard = () => {
  // Mock data - in a real app, this would come from user's logged data
  const mockData = {
    cycleDay: 14,
    cycleLength: 28,
    nextPeriod: '7 days',
    riskScore: 35,
    recentSymptoms: ['Mood swings', 'Irregular periods', 'Acne'],
    insights: [
      'Your cycle has been irregular for the past 3 months',
      'Consider tracking weight and mood more consistently',
      'Based on your symptoms, consider consulting a healthcare provider'
    ]
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'bg-green-500' };
    if (score < 60) return { level: 'Moderate', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  const riskLevel = getRiskLevel(mockData.riskScore);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600">Here's your health overview</p>
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
            <div className="text-2xl font-bold text-pink-900">
              Day {mockData.cycleDay}
            </div>
            <p className="text-sm text-pink-600">of {mockData.cycleLength}-day cycle</p>
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
            <div className="text-2xl font-bold text-purple-900">
              {mockData.nextPeriod}
            </div>
            <p className="text-sm text-purple-600">Expected date</p>
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
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-900">
                {mockData.riskScore}%
              </div>
              <Badge variant="secondary" className={`${riskLevel.color} text-white`}>
                {riskLevel.level}
              </Badge>
            </div>
            <Progress value={mockData.riskScore} className="mt-2" />
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
              {mockData.recentSymptoms.length}
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
          <div className="flex flex-wrap gap-2">
            {mockData.recentSymptoms.map((symptom, index) => (
              <Badge key={index} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                {symptom}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockData.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
