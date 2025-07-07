
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, Heart, Stethoscope, Calendar, Users, ArrowRight } from 'lucide-react';

interface AssessmentData {
  age: string;
  height: string;
  weight: string;
  ethnicity: string;
  cycleLength: string;
  periodFrequency: string;
  lastPeriodDate: string;
  flowIntensity: string;
  irregularPeriods: string;
  symptoms: string[];
  acneSeverity: string;
  hairGrowth: string;
  hairLoss: string;
  weightChanges: string;
  moodSymptoms: string[];
  familyHistory: string;
  medications: string;
  additionalNotes: string;
}

interface PCOSResultsProps {
  assessmentData: AssessmentData;
  onRetakeAssessment: () => void;
}

export const PCOSResults = ({ assessmentData, onRetakeAssessment }: PCOSResultsProps) => {
  // Calculate PCOS risk score based on assessment data
  const calculateRiskScore = () => {
    let score = 0;
    
    // Period irregularity (high weight)
    if (assessmentData.periodFrequency === 'irregular' || assessmentData.periodFrequency === 'infrequent' || assessmentData.periodFrequency === 'absent') {
      score += 25;
    }
    
    // Physical symptoms
    const pcosSymptoms = [
      'Irregular or missed periods',
      'Acne (especially on face, chest, back)',
      'Excessive hair growth (face, chest, abdomen)',
      'Male-pattern hair loss',
      'Weight gain or difficulty losing weight'
    ];
    
    const matchingSymptoms = assessmentData.symptoms.filter(symptom => 
      pcosSymptoms.includes(symptom)
    ).length;
    score += matchingSymptoms * 8;
    
    // Acne severity
    if (assessmentData.acneSeverity === 'moderate') score += 10;
    if (assessmentData.acneSeverity === 'severe') score += 15;
    
    // Weight changes
    if (assessmentData.weightChanges === 'gained-5-10') score += 8;
    if (assessmentData.weightChanges === 'gained-10plus') score += 12;
    if (assessmentData.weightChanges === 'difficulty-losing') score += 10;
    
    // Family history
    if (assessmentData.familyHistory === 'yes-pcos') score += 15;
    if (assessmentData.familyHistory === 'yes-diabetes') score += 8;
    if (assessmentData.familyHistory === 'multiple') score += 20;
    
    // Mood symptoms (can indicate hormonal imbalance)
    score += Math.min(assessmentData.moodSymptoms.length * 3, 15);
    
    return Math.min(score, 100); // Cap at 100
  };

  const riskScore = calculateRiskScore();
  
  const getRiskLevel = () => {
    if (riskScore < 30) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (riskScore < 60) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const risk = getRiskLevel();

  const getPersonalizedRecommendations = () => {
    const recommendations = [];
    
    if (assessmentData.periodFrequency !== 'regular') {
      recommendations.push('Track your menstrual cycle daily to identify patterns');
    }
    
    if (assessmentData.symptoms.includes('Weight gain or difficulty losing weight') || 
        assessmentData.weightChanges.includes('gained')) {
      recommendations.push('Focus on a balanced diet with low glycemic index foods');
      recommendations.push('Include regular physical activity (aim for 150 minutes per week)');
    }
    
    if (assessmentData.acneSeverity === 'moderate' || assessmentData.acneSeverity === 'severe') {
      recommendations.push('Consider consulting a dermatologist for acne management');
    }
    
    if (assessmentData.moodSymptoms.length > 2) {
      recommendations.push('Practice stress management techniques like yoga or meditation');
      recommendations.push('Ensure adequate sleep (7-9 hours per night)');
    }
    
    if (riskScore >= 60) {
      recommendations.push('Schedule an appointment with a gynecologist or endocrinologist');
      recommendations.push('Request hormone level testing (androgens, insulin, LH/FSH)');
    }
    
    return recommendations;
  };

  const getSymptomsToWatch = () => {
    const currentSymptoms = [...assessmentData.symptoms, ...assessmentData.moodSymptoms];
    const allPCOSSymptoms = [
      'Irregular or missed periods',
      'Heavy menstrual bleeding',
      'Acne (especially on face, chest, back)',
      'Excessive hair growth (face, chest, abdomen)',
      'Male-pattern hair loss',
      'Weight gain or difficulty losing weight',
      'Dark patches of skin',
      'Mood swings',
      'Depression or anxiety',
      'Insulin resistance symptoms'
    ];
    
    return allPCOSSymptoms.filter(symptom => !currentSymptoms.includes(symptom));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Your PCOS Risk Assessment Results
          </h1>
          <p className="text-gray-600">
            Based on your responses, here's your personalized analysis
          </p>
        </div>

        {/* Risk Score Card */}
        <Card className={`mb-6 ${risk.borderColor} border-2`}>
          <CardHeader className={risk.bgColor}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`text-2xl ${risk.color}`}>
                  PCOS Risk Level: {risk.level}
                </CardTitle>
                <p className="text-gray-600 mt-1">Risk Score: {riskScore}/100</p>
              </div>
              {risk.level === 'Low' && <CheckCircle className={`w-12 h-12 ${risk.color}`} />}
              {risk.level === 'Moderate' && <Info className={`w-12 h-12 ${risk.color}`} />}
              {risk.level === 'High' && <AlertTriangle className={`w-12 h-12 ${risk.color}`} />}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Progress value={riskScore} className="h-3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-medium">Low Risk</div>
                <div className="text-gray-500">0-29</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-medium">Moderate Risk</div>
                <div className="text-gray-500">30-59</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-medium">High Risk</div>
                <div className="text-gray-500">60-100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Key Findings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-pink-500" />
                <span>Key Findings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessmentData.periodFrequency !== 'regular' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Irregular Periods</AlertTitle>
                    <AlertDescription>
                      Your menstrual cycle irregularity is a key indicator that warrants attention.
                    </AlertDescription>
                  </Alert>
                )}
                
                {assessmentData.symptoms.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Reported Symptoms ({assessmentData.symptoms.length})</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {assessmentData.symptoms.slice(0, 3).map((symptom, index) => (
                        <li key={index}>• {symptom}</li>
                      ))}
                      {assessmentData.symptoms.length > 3 && (
                        <li>• And {assessmentData.symptoms.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}

                {assessmentData.familyHistory.includes('yes') && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Family History</AlertTitle>
                    <AlertDescription>
                      Your family history increases your risk and should be discussed with healthcare providers.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Symptoms to Watch */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Symptoms to Watch For</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Monitor these additional PCOS symptoms:
              </p>
              <div className="space-y-2">
                {getSymptomsToWatch().slice(0, 5).map((symptom, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>{symptom}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Keep track of any new symptoms and discuss them with your healthcare provider.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span>Personalized Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPersonalizedRecommendations().map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-pink-50 rounded-lg">
                  <ArrowRight className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span>Suggested Next Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskScore >= 60 ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-red-800">High Priority</AlertTitle>
                  <AlertDescription className="text-red-700">
                    We recommend scheduling an appointment with a healthcare provider within the next 2-4 weeks to discuss your symptoms and consider diagnostic testing.
                  </AlertDescription>
                </Alert>
              ) : riskScore >= 30 ? (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-yellow-800">Moderate Priority</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Consider discussing your symptoms with a healthcare provider at your next routine visit or within the next 1-2 months.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle className="text-green-800">Continue Monitoring</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your risk appears low, but continue to monitor your cycle and symptoms. Maintain healthy lifestyle habits.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Helpful Resources</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use our cycle tracker to monitor patterns</li>
                  <li>• Log symptoms daily for better insights</li>
                  <li>• Read our educational resources about PCOS</li>
                  <li>• Join our community support groups</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onRetakeAssessment}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Retake Assessment</span>
          </Button>
          
          <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Start Tracking Your Cycle</span>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
          <p>
            <strong>Important:</strong> This assessment is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always consult with qualified healthcare providers regarding your health concerns.
          </p>
        </div>
      </div>
    </div>
  );
};
