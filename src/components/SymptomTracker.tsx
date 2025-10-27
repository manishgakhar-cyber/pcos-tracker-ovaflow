
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const SymptomTracker = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const symptomCategories = {
    'Menstrual': [
      'Irregular periods',
      'Heavy bleeding',
      'Light bleeding',
      'Missed period',
      'Painful periods',
      'Spotting'
    ],
    'Physical': [
      'Acne',
      'Weight gain',
      'Hair loss',
      'Excessive hair growth',
      'Breast tenderness',
      'Bloating',
      'Headaches',
      'Fatigue'
    ],
    'Emotional': [
      'Mood swings',
      'Anxiety',
      'Depression',
      'Irritability',
      'Low energy',
      'Sleep issues'
    ],
    'Other': [
      'Cravings',
      'Nausea',
      'Back pain',
      'Abdominal pain'
    ]
  };

  const flowOptions = [
    { value: 'none', label: 'No flow', color: 'bg-gray-200' },
    { value: 'light', label: 'Light', color: 'bg-pink-200' },
    { value: 'medium', label: 'Medium', color: 'bg-pink-400' },
    { value: 'heavy', label: 'Heavy', color: 'bg-pink-600' },
    { value: 'very-heavy', label: 'Very Heavy', color: 'bg-red-600' }
  ];

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const customSymptomSchema = z.string()
    .min(2, 'Symptom name must be at least 2 characters')
    .max(50, 'Symptom name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Only letters, spaces, hyphens, and apostrophes allowed');

  const notesSchema = z.string().max(500, 'Notes must be less than 500 characters');

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    
    if (!trimmed) {
      return;
    }

    // Check max custom symptoms limit
    const customSymptomsCount = selectedSymptoms.filter(s => 
      !Object.values(symptomCategories).flat().includes(s)
    ).length;
    
    if (customSymptomsCount >= 10) {
      toast({
        title: 'Limit Reached',
        description: 'You can only add up to 10 custom symptoms',
        variant: 'destructive',
      });
      return;
    }

    // Validate custom symptom
    try {
      customSymptomSchema.parse(trimmed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Invalid Input',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (selectedSymptoms.includes(trimmed)) {
      toast({
        title: 'Duplicate Symptom',
        description: 'This symptom is already added',
        variant: 'destructive',
      });
      return;
    }

    setSelectedSymptoms(prev => [...prev, trimmed]);
    setCustomSymptom('');
  };

  const handleSavePeriod = async () => {
    if (!selectedDate) {
      toast({
        title: 'Date Required',
        description: 'Please select a date for your period',
        variant: 'destructive',
      });
      return;
    }

    if (!flowIntensity || flowIntensity === 'none') {
      toast({
        title: 'Flow Required',
        description: 'Please select a flow intensity',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to log your period',
          variant: 'destructive',
        });
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Save to symptom_logs with flow
      await supabase.from('symptom_logs').insert({
        user_id: user.id,
        log_date: formattedDate,
        flow_intensity: flowIntensity,
        symptoms: null,
        notes: null,
      });

      // Save to cycle_data
      const { data: recentCycle } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const logDate = new Date(formattedDate);
      
      if (recentCycle) {
        const endDate = recentCycle.period_end_date 
          ? new Date(recentCycle.period_end_date)
          : new Date(recentCycle.period_start_date);
        
        const daysDiff = Math.floor((logDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If within 1 day of last period, extend it
        if (daysDiff <= 1 && daysDiff >= 0) {
          await supabase
            .from('cycle_data')
            .update({ period_end_date: formattedDate })
            .eq('id', recentCycle.id);
        } else {
          // New period - calculate cycle length from previous period
          const cycleLength = Math.floor(
            (logDate.getTime() - new Date(recentCycle.period_start_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Update previous cycle with calculated length
          await supabase
            .from('cycle_data')
            .update({ cycle_length: cycleLength })
            .eq('id', recentCycle.id);
          
          // Create new period entry
          await supabase.from('cycle_data').insert({
            user_id: user.id,
            period_start_date: formattedDate,
            period_end_date: formattedDate,
          });
        }
      } else {
        // First period entry
        await supabase.from('cycle_data').insert({
          user_id: user.id,
          period_start_date: formattedDate,
          period_end_date: formattedDate,
        });
      }

      toast({
        title: "Period logged!",
        description: `Logged ${flowIntensity} flow for ${format(selectedDate, 'PPP')}`,
      });
      
      setFlowIntensity('');
    } catch (error) {
      console.error('Error saving period:', error);
      toast({
        title: 'Error',
        description: 'Failed to log period. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSymptoms = async () => {
    // Validate notes
    try {
      notesSchema.parse(notes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Invalid Notes',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!selectedDate) {
      toast({
        title: 'Date Required',
        description: 'Please select a date for your symptoms',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSymptoms.length === 0 && !notes) {
      toast({
        title: 'No Symptoms',
        description: 'Please select at least one symptom or add notes',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to save symptoms',
          variant: 'destructive',
        });
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Save symptom log
      const { error: symptomError } = await supabase.from('symptom_logs').insert({
        user_id: user.id,
        log_date: formattedDate,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
        flow_intensity: null,
        notes: notes || null,
      });

      if (symptomError) {
        console.error('Database error:', symptomError);
        toast({
          title: 'Save Failed',
          description: 'Failed to save symptoms. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: "Symptoms logged!",
        description: `Logged ${selectedSymptoms.length} symptoms for ${format(selectedDate, 'PPP')}`,
      });
      
      // Reset form
      setSelectedSymptoms([]);
      setNotes('');
    } catch (error) {
      console.error('Error saving symptoms:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Track Your Health</h2>
        <p className="text-gray-600">Log your period and symptoms separately</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Logging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Menstrual Flow Intensity</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {flowOptions.filter(opt => opt.value !== 'none').map((option) => (
                  <Button
                    key={option.value}
                    variant={flowIntensity === option.value ? "default" : "outline"}
                    onClick={() => setFlowIntensity(option.value)}
                    className={cn(
                      "justify-start h-auto py-2",
                      flowIntensity === option.value && "ring-2 ring-red-500"
                    )}
                  >
                    <div className={`w-4 h-4 rounded-full mr-2 ${option.color}`}></div>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSavePeriod} 
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Period'}
            </Button>
          </CardContent>
        </Card>

        {/* Symptoms Logging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Symptoms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(symptomCategories).map(([category, symptoms]) => (
              <div key={category}>
                <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label
                        htmlFor={symptom}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Symptom */}
            <div>
              <Label className="text-sm font-medium">Add Custom Symptom</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter custom symptom (max 50 chars)..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                  maxLength={50}
                />
                <Button onClick={addCustomSymptom} size="sm">
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only letters, spaces, hyphens, and apostrophes (2-50 characters, max 10 custom)
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about how you're feeling (max 500 chars)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Selected Symptoms Summary */}
            {selectedSymptoms.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Selected Symptoms ({selectedSymptoms.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSymptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs border border-purple-200"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveSymptoms} 
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Symptoms'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
