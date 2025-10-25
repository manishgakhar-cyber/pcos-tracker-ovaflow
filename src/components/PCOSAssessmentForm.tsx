import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Heart, User, Calendar, Stethoscope, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PCOSResults } from './PCOSResults';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

// Validation schema with comprehensive rules
const assessmentSchema = z.object({
  // Personal Details - Step 1
  age: z.string()
    .min(1, 'Age is required')
    .refine((val) => !isNaN(Number(val)), 'Age must be a valid number')
    .refine((val) => Number(val) >= 10 && Number(val) <= 100, 'Age must be between 10 and 100'),
  height: z.string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 48 && Number(val) <= 96), 
      'Height must be between 48 and 96 inches'),
  weight: z.string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 50 && Number(val) <= 500), 
      'Weight must be between 50 and 500 lbs'),
  ethnicity: z.string(),
  
  // Period Details - Step 2
  periodFrequency: z.string().min(1, 'Please select your period frequency'),
  cycleLength: z.string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 14 && Number(val) <= 60), 
      'Cycle length must be between 14 and 60 days'),
  lastPeriodDate: z.string(),
  flowIntensity: z.string(),
  irregularPeriods: z.string(),
  
  // Symptoms - Step 3
  symptoms: z.array(z.string()),
  acneSeverity: z.string(),
  hairGrowth: z.string(),
  hairLoss: z.string(),
  weightChanges: z.string(),
  moodSymptoms: z.array(z.string()),
  
  // Additional Information - Step 4
  familyHistory: z.string(),
  medications: z.string()
    .refine((val) => val.length <= 500, 'Medications must be less than 500 characters'),
  additionalNotes: z.string()
    .refine((val) => val.length <= 500, 'Additional notes must be less than 500 characters'),
});

// Define interface for assessment data
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

// Step-specific validation schemas
const step1Schema = assessmentSchema.pick({ age: true, height: true, weight: true, ethnicity: true });
const step2Schema = assessmentSchema.pick({ periodFrequency: true, cycleLength: true, lastPeriodDate: true, flowIntensity: true, irregularPeriods: true });
const step3Schema = assessmentSchema.pick({ symptoms: true, acneSeverity: true, hairGrowth: true, hairLoss: true, weightChanges: true, moodSymptoms: true });
const step4Schema = assessmentSchema.pick({ familyHistory: true, medications: true, additionalNotes: true });

interface PCOSAssessmentFormProps {
  onComplete?: () => void;
  isEdit?: boolean;
}

export const PCOSAssessmentForm = ({ onComplete, isEdit = false }: PCOSAssessmentFormProps = {}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssessmentData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      age: '',
      height: '',
      weight: '',
      ethnicity: '',
      cycleLength: '',
      periodFrequency: '',
      lastPeriodDate: '',
      flowIntensity: '',
      irregularPeriods: '',
      symptoms: [],
      acneSeverity: '',
      hairGrowth: '',
      hairLoss: '',
      weightChanges: '',
      moodSymptoms: [],
      familyHistory: '',
      medications: '',
      additionalNotes: ''
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const physicalSymptoms = [
    'Irregular or missed periods',
    'Heavy menstrual bleeding',
    'Acne (especially on face, chest, back)',
    'Excessive hair growth (face, chest, abdomen)',
    'Male-pattern hair loss',
    'Weight gain or difficulty losing weight',
    'Dark patches of skin',
    'Skin tags'
  ];

  const moodSymptoms = [
    'Mood swings',
    'Depression',
    'Anxiety',
    'Irritability',
    'Low energy/fatigue',
    'Sleep problems',
    'Difficulty concentrating'
  ];

  const handleSymptomToggle = (symptom: string, type: 'symptoms' | 'moodSymptoms') => {
    const currentValues = form.getValues(type);
    const newValues = currentValues.includes(symptom)
      ? currentValues.filter(s => s !== symptom)
      : [...currentValues, symptom];
    form.setValue(type, newValues, { shouldValidate: true });
  };

  const validateCurrentStep = async () => {
    const values = form.getValues();
    let isValid = false;
    
    try {
      switch (currentStep) {
        case 1:
          await step1Schema.parseAsync({
            age: values.age,
            height: values.height,
            weight: values.weight,
            ethnicity: values.ethnicity,
          });
          isValid = true;
          break;
        case 2:
          await step2Schema.parseAsync({
            periodFrequency: values.periodFrequency,
            cycleLength: values.cycleLength,
            lastPeriodDate: values.lastPeriodDate,
            flowIntensity: values.flowIntensity,
            irregularPeriods: values.irregularPeriods,
          });
          isValid = true;
          break;
        case 3:
          await step3Schema.parseAsync({
            symptoms: values.symptoms,
            acneSeverity: values.acneSeverity,
            hairGrowth: values.hairGrowth,
            hairLoss: values.hairLoss,
            weightChanges: values.weightChanges,
            moodSymptoms: values.moodSymptoms,
          });
          isValid = true;
          break;
        case 4:
          await step4Schema.parseAsync({
            familyHistory: values.familyHistory,
            medications: values.medications,
            additionalNotes: values.additionalNotes,
          });
          isValid = true;
          break;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Manually set errors for fields in current step
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof AssessmentData;
          form.setError(field, { message: err.message });
        });
        
        toast({
          title: "Validation Error",
          description: "Please fix the errors before continuing.",
          variant: "destructive",
        });
      }
      isValid = false;
    }
    
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please check all fields and correct any errors.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = form.getValues();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Use AI to analyze the assessment
      toast({
        title: "Analyzing...",
        description: "Our AI is analyzing your assessment data with medical databases...",
      });

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-pcos-assessment',
        {
          body: { assessmentData: formData }
        }
      );

      if (analysisError) {
        throw analysisError;
      }

      const { riskScore, riskLevel } = analysisData;

      // If editing, update existing assessment, otherwise insert new one
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('pcos_assessments')
          .update({
            assessment_data: formData as any,
            risk_score: riskScore,
            risk_level: riskLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('pcos_assessments')
          .insert([{
            user_id: user.id,
            assessment_data: formData as any,
            risk_score: riskScore,
            risk_level: riskLevel
          }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Assessment Complete!",
        description: isEdit 
          ? "Your PCOS risk assessment has been updated successfully."
          : "Your PCOS risk assessment has been saved successfully.",
      });
      
      setShowResults(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeAssessment = () => {
    setShowResults(false);
    setCurrentStep(1);
    form.reset();
  };

  if (showResults) {
    return (
      <PCOSResults 
        assessmentData={form.getValues()} 
        onRetakeAssessment={handleRetakeAssessment}
        onComplete={onComplete}
      />
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter your age"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ethnicity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ethnicity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="south-asian">South Asian</SelectItem>
                        <SelectItem value="east-asian">East Asian</SelectItem>
                        <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                        <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                        <SelectItem value="african">African/African American</SelectItem>
                        <SelectItem value="caucasian">Caucasian</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (inches)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 65"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 130"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold">Menstrual Cycle Information</h3>
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="periodFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often do you get your period? *</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange}
                        value={field.value}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="regular" id="regular" />
                          <Label htmlFor="regular">Regular (every 21-35 days)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="irregular" id="irregular" />
                          <Label htmlFor="irregular">Irregular (varies significantly)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="infrequent" id="infrequent" />
                          <Label htmlFor="infrequent">Infrequent (more than 35 days apart)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id="absent" />
                          <Label htmlFor="absent">Absent (no periods for 3+ months)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cycleLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical cycle length (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastPeriodDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last period date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="flowIntensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flow intensity</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange}
                        value={field.value}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="light" id="light" />
                          <Label htmlFor="light">Light</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="heavy" id="heavy" />
                          <Label htmlFor="heavy">Heavy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="very-heavy" id="very-heavy" />
                          <Label htmlFor="very-heavy">Very Heavy</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Stethoscope className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold">Symptoms Assessment</h3>
            </div>
            
            <div>
              <Label className="text-base font-medium">Physical Symptoms</Label>
              <p className="text-sm text-gray-600 mb-3">Check all symptoms you've experienced in the past 6 months:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {physicalSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={form.watch('symptoms').includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom, 'symptoms')}
                    />
                    <Label htmlFor={symptom} className="text-sm font-normal">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-base font-medium">Mood & Energy Symptoms</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {moodSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={form.watch('moodSymptoms').includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom, 'moodSymptoms')}
                    />
                    <Label htmlFor={symptom} className="text-sm font-normal">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="acneSeverity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acne severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weightChanges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight changes in past year</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select change" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-change">No significant change</SelectItem>
                        <SelectItem value="gained-5-10">Gained 5-10 kg</SelectItem>
                        <SelectItem value="gained-10plus">Gained 10+ kg</SelectItem>
                        <SelectItem value="lost-weight">Lost weight</SelectItem>
                        <SelectItem value="difficulty-losing">Difficulty losing weight</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold">Additional Information</h3>
            </div>
            
            <FormField
              control={form.control}
              name="familyHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family history of PCOS, diabetes, or fertility issues?</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange}
                      value={field.value}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes-pcos" id="yes-pcos" />
                        <Label htmlFor="yes-pcos">Yes, PCOS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes-diabetes" id="yes-diabetes" />
                        <Label htmlFor="yes-diabetes">Yes, diabetes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes-fertility" id="yes-fertility" />
                        <Label htmlFor="yes-fertility">Yes, fertility issues</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple" id="multiple" />
                        <Label htmlFor="multiple">Multiple conditions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no">No known family history</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unsure" id="unsure" />
                        <Label htmlFor="unsure">Unsure</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current medications or supplements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any medications, birth control, or supplements you're currently taking..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional notes or concerns</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other symptoms, concerns, or information you'd like to share..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PCOS Risk Assessment
          </h1>
          <p className="text-gray-600">
            Help us understand your symptoms to provide personalized insights
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Step {currentStep}: {
                currentStep === 1 ? 'Personal Information' :
                currentStep === 2 ? 'Menstrual Cycle' :
                currentStep === 3 ? 'Symptoms' :
                'Additional Information'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Saving...' : 'Complete Assessment'}</span>
                  <Heart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </Form>
  );
};
