
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

export const SymptomTracker = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('');
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

  const handleSave = () => {
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

    // In a real app, this would save to a database
    toast({
      title: "Symptoms logged successfully!",
      description: `Logged ${selectedSymptoms.length} symptoms for ${selectedDate ? format(selectedDate, 'PPP') : 'today'}`,
    });
    
    // Reset form
    setSelectedSymptoms([]);
    setNotes('');
    setFlowIntensity('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Log Your Symptoms</h2>
        <p className="text-gray-600">Track your daily symptoms to identify patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selection */}
        <Card className="lg:col-span-1">
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

            {/* Flow Intensity */}
            <div className="mt-6">
              <Label className="text-sm font-medium">Menstrual Flow</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {flowOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={flowIntensity === option.value ? "default" : "outline"}
                    onClick={() => setFlowIntensity(option.value)}
                    className={cn(
                      "justify-start h-auto py-2",
                      flowIntensity === option.value && "ring-2 ring-pink-500"
                    )}
                  >
                    <div className={`w-4 h-4 rounded-full mr-2 ${option.color}`}></div>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Symptoms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(symptomCategories).map(([category, symptoms]) => (
              <div key={category}>
                <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs border border-pink-200"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              Save Symptoms
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
