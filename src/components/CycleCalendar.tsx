
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SYMPTOM_OPTIONS = [
  'Cramps', 'Bloating', 'Mood Swings', 'Headache', 'Fatigue',
  'Breast Tenderness', 'Acne', 'Back Pain', 'Nausea', 'Spotting'
];

export const CycleCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
  const [cycleData, setCycleData] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'symptom' | 'period', id: string } | null>(null);
  const [editSymptoms, setEditSymptoms] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch symptom logs
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id);

      // Fetch cycle data
      const { data: cycles } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', user.id);

      setSymptomLogs(symptoms || []);
      setCycleData(cycles || []);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate average cycle length using weighted average
  const getAvgCycleLength = () => {
    const completedCycles = cycleData.filter(cycle => cycle.cycle_length && cycle.cycle_length > 0).sort((a, b) => 
      new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
    );
    
    if (completedCycles.length === 0) return 28;
    
    const weights = [0.4, 0.3, 0.2, 0.1];
    const cyclesToUse = completedCycles.slice(0, 4);
    let weightedSum = 0;
    let totalWeight = 0;
    cyclesToUse.forEach((cycle, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += cycle.cycle_length * weight;
      totalWeight += weight;
    });
    return Math.round(weightedSum / totalWeight);
  };

  const avgCycleLengthCalc = getAvgCycleLength();

  // Calculate predicted period dates based on cycle data
  const getPredictedPeriodDates = () => {
    if (cycleData.length === 0) return [];
    
    const sortedCycles = [...cycleData].sort((a, b) => 
      new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
    );
    const lastCycle = sortedCycles[0];
    const lastPeriodStart = new Date(lastCycle.period_start_date);
    
    const predictions: Date[] = [];
    let nextPredicted = addDays(lastPeriodStart, avgCycleLengthCalc);
    
    for (let i = 0; i < 6; i++) {
      predictions.push(nextPredicted);
      nextPredicted = addDays(nextPredicted, avgCycleLengthCalc);
    }
    
    return predictions;
  };

  // Calculate fertility window dates (typically days 10-17, with ovulation around day 14)
  const getFertilityWindowDates = () => {
    if (cycleData.length === 0) return [];
    
    const sortedCycles = [...cycleData].sort((a, b) => 
      new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
    );
    const lastCycle = sortedCycles[0];
    const lastPeriodStart = new Date(lastCycle.period_start_date);
    
    // Ovulation typically occurs 14 days before the next period
    // Fertility window is ~5 days before ovulation and 1 day after
    const ovulationDay = avgCycleLengthCalc - 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 1;
    
    const fertilityDates: Date[] = [];
    
    // Generate fertility windows for current and future cycles
    for (let cycleOffset = 0; cycleOffset < 6; cycleOffset++) {
      const cycleStart = addDays(lastPeriodStart, cycleOffset * avgCycleLengthCalc);
      for (let day = fertileStart; day <= fertileEnd; day++) {
        fertilityDates.push(addDays(cycleStart, day));
      }
    }
    
    return fertilityDates;
  };

  // Calculate prediction accuracy based on historical data
  const calculatePredictionAccuracy = () => {
    if (cycleData.length < 2) return null;
    
    const sortedCycles = [...cycleData].sort((a, b) => 
      new Date(a.period_start_date).getTime() - new Date(b.period_start_date).getTime()
    );
    
    const accuracyData: { predicted: Date; actual: Date; difference: number }[] = [];
    
    // For each cycle (except the first), calculate what the prediction would have been
    for (let i = 1; i < sortedCycles.length; i++) {
      const previousCycle = sortedCycles[i - 1];
      const currentCycle = sortedCycles[i];
      
      // Use the cycle lengths available up to that point to predict
      const previousCycles = sortedCycles.slice(0, i);
      const cyclesWithLength = previousCycles.filter(c => c.cycle_length && c.cycle_length > 0);
      
      let predictedLength = 28;
      if (cyclesWithLength.length > 0) {
        const recentCycles = [...cyclesWithLength].reverse().slice(0, 4);
        const weights = [0.4, 0.3, 0.2, 0.1];
        let weightedSum = 0;
        let totalWeight = 0;
        recentCycles.forEach((cycle, index) => {
          const weight = weights[index] || 0.1;
          weightedSum += cycle.cycle_length * weight;
          totalWeight += weight;
        });
        predictedLength = Math.round(weightedSum / totalWeight);
      }
      
      const predictedDate = addDays(new Date(previousCycle.period_start_date), predictedLength);
      const actualDate = new Date(currentCycle.period_start_date);
      const difference = Math.abs(Math.round((predictedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      accuracyData.push({ predicted: predictedDate, actual: actualDate, difference });
    }
    
    if (accuracyData.length === 0) return null;
    
    const avgDifference = accuracyData.reduce((sum, d) => sum + d.difference, 0) / accuracyData.length;
    const withinOneDay = accuracyData.filter(d => d.difference <= 1).length;
    const withinThreeDays = accuracyData.filter(d => d.difference <= 3).length;
    
    return {
      totalPredictions: accuracyData.length,
      avgDifference: Math.round(avgDifference * 10) / 10,
      withinOneDay,
      withinThreeDays,
      accuracyPercent: Math.round((withinThreeDays / accuracyData.length) * 100),
    };
  };

  const predictedDates = getPredictedPeriodDates();
  const fertilityDates = getFertilityWindowDates();
  const predictionAccuracy = calculatePredictionAccuracy();

  const getDayType = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Check if it's a period day first (takes priority)
    const isPeriodDay = cycleData.some(cycle => {
      const startDate = new Date(cycle.period_start_date);
      const endDate = cycle.period_end_date ? new Date(cycle.period_end_date) : startDate;
      return day >= startDate && day <= endDate;
    });
    if (isPeriodDay) {
      return 'period';
    }
    
    // Check if it's a predicted period start date
    const isPredicted = predictedDates.some(predDate => isSameDay(day, predDate));
    if (isPredicted) {
      return 'predicted';
    }
    
    // Check if it's in the fertility window
    const isFertile = fertilityDates.some(fertDate => isSameDay(day, fertDate));
    if (isFertile) {
      return 'fertile';
    }
    
    // Then check if there are symptoms logged
    const hasSymptoms = symptomLogs.some(log => log.log_date === dayStr);
    if (hasSymptoms) {
      return 'symptoms';
    }
    
    return 'normal';
  };

  const getDaySymptoms = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = symptomLogs.find(log => log.log_date === dayStr);
    return log?.symptoms || [];
  };

  const getDayStyles = (day: Date, type: string) => {
    const baseStyles = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer";
    
    switch (type) {
      case 'period':
        return `${baseStyles} bg-red-500 text-white hover:bg-red-600`;
      case 'predicted':
        return `${baseStyles} bg-amber-100 text-amber-800 hover:bg-amber-200 border-2 border-dashed border-amber-400`;
      case 'fertile':
        return `${baseStyles} bg-teal-100 text-teal-800 hover:bg-teal-200 border-2 border-teal-400`;
      case 'symptoms':
        return `${baseStyles} bg-purple-100 text-purple-800 hover:bg-purple-200 border-2 border-purple-300`;
      default:
        return `${baseStyles} hover:bg-gray-100 text-gray-700`;
    }
  };

  const getSelectedDateInfo = () => {
    if (!selectedDate) return null;
    
    const dayType = getDayType(selectedDate);
    const symptoms = getDaySymptoms(selectedDate);
    const dayStr = format(selectedDate, 'yyyy-MM-dd');
    const symptomLog = symptomLogs.find(log => log.log_date === dayStr);
    const periodCycle = cycleData.find(cycle => {
      const startDate = new Date(cycle.period_start_date);
      const endDate = cycle.period_end_date ? new Date(cycle.period_end_date) : startDate;
      return selectedDate >= startDate && selectedDate <= endDate;
    });
    
    return { dayType, symptoms, symptomLog, periodCycle };
  };

  const handleEditSymptomLog = (log: any) => {
    setEditingLog(log);
    setEditSymptoms(log.symptoms || []);
    setEditNotes(log.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    const { error } = await supabase
      .from('symptom_logs')
      .update({
        symptoms: editSymptoms,
        notes: editNotes
      })
      .eq('id', editingLog.id);

    if (error) {
      toast.error('Failed to update log');
      return;
    }

    toast.success('Log updated successfully');
    setEditDialogOpen(false);
    
    // Refresh data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id);
      setSymptomLogs(symptoms || []);
    }
  };

  const handleDeleteClick = (type: 'symptom' | 'period', id: string) => {
    setDeletingItem({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const table = deletingItem.type === 'symptom' ? 'symptom_logs' : 'cycle_data';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', deletingItem.id);

    if (error) {
      toast.error('Failed to delete');
      return;
    }

    toast.success('Deleted successfully');
    setDeleteDialogOpen(false);
    setDeletingItem(null);
    
    // Refresh data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id);
      const { data: cycles } = await supabase
        .from('cycle_data')
        .select('*')
        .eq('user_id', user.id);
      setSymptomLogs(symptoms || []);
      setCycleData(cycles || []);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = symptomLogs.length > 0 || cycleData.length > 0;
  
  // Count unique symptom days in the month
  const monthSymptomCount = symptomLogs.filter(log => {
    const logDate = new Date(log.log_date);
    return isSameMonth(logDate, currentMonth) && log.symptoms && log.symptoms.length > 0;
  }).length;
  
  // Count period days in the month
  const monthPeriodDays = days.filter(day => {
    if (!isSameMonth(day, currentMonth)) return false;
    return cycleData.some(cycle => {
      const startDate = new Date(cycle.period_start_date);
      const endDate = cycle.period_end_date ? new Date(cycle.period_end_date) : startDate;
      return day >= startDate && day <= endDate;
    });
  }).length;
  
  // Calculate weighted average cycle length from completed cycles (same algorithm as Dashboard)
  const completedCycles = cycleData.filter(cycle => cycle.cycle_length && cycle.cycle_length > 0).sort((a, b) => 
    new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
  );
  
  let avgCycleLength = null;
  if (completedCycles.length > 0) {
    // Use weighted average: recent cycles get higher weights [0.4, 0.3, 0.2, 0.1]
    const weights = [0.4, 0.3, 0.2, 0.1];
    const cyclesToUse = completedCycles.slice(0, 4); // Up to 4 most recent cycles
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    cyclesToUse.forEach((cycle, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += cycle.cycle_length * weight;
      totalWeight += weight;
    });
    
    avgCycleLength = Math.round(weightedSum / totalWeight);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Cycle Calendar</h2>
        <p className="text-gray-600">Track your menstrual cycle and symptoms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const dayType = getDayType(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                
                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`${getDayStyles(day, dayType)} ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    } ${isToday ? 'ring-2 ring-purple-400' : ''
                    } ${isSelected ? 'ring-2 ring-purple-600' : ''}`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend and Selected Date Info */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm">Period</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-amber-100 border-2 border-dashed border-amber-400 rounded-full"></div>
                <span className="text-sm">Predicted Period</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-teal-100 border-2 border-teal-400 rounded-full"></div>
                <span className="text-sm">Fertility Window</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-300 border-2 border-purple-400 rounded-full"></div>
                <span className="text-sm">Symptoms Logged</span>
              </div>
              {!hasAnyData && (
                <p className="text-xs text-gray-500 mt-3">Start tracking to see your cycle data</p>
              )}
            </CardContent>
          </Card>

          {/* Selected Date Info */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const info = getSelectedDateInfo();
                  if (!info) return null;

                  return (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Status: </span>
                        <Badge variant="outline" className={
                          info.dayType === 'period' ? 'bg-red-100 text-red-800' :
                          info.dayType === 'predicted' ? 'bg-amber-100 text-amber-800' :
                          info.dayType === 'fertile' ? 'bg-teal-100 text-teal-800' :
                          info.dayType === 'symptoms' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {info.dayType === 'period' ? 'Period' :
                           info.dayType === 'predicted' ? 'Predicted Period Start' :
                           info.dayType === 'fertile' ? 'Fertility Window' :
                           info.dayType === 'symptoms' ? 'Symptoms Logged' :
                           'Normal Day'}
                        </Badge>
                      </div>
                      
                      {info.symptoms.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Symptoms:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {info.symptoms.map((symptom, index) => (
                              <Badge key={index} variant="outline" className="bg-pink-50 text-pink-700 text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4">
                        {info.symptomLog && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSymptomLog(info.symptomLog)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick('symptom', info.symptomLog.id)}
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                        {info.periodCycle && !info.symptomLog && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick('period', info.periodCycle.id)}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Period
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Prediction Accuracy */}
          {predictionAccuracy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Accuracy</span>
                  <Badge className={
                    predictionAccuracy.accuracyPercent >= 80 ? 'bg-green-100 text-green-800' :
                    predictionAccuracy.accuracyPercent >= 60 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {predictionAccuracy.accuracyPercent}%
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Based on {predictionAccuracy.totalPredictions} prediction{predictionAccuracy.totalPredictions !== 1 ? 's' : ''}</p>
                  <p>Avg difference: ±{predictionAccuracy.avgDifference} day{predictionAccuracy.avgDifference !== 1 ? 's' : ''}</p>
                  <p>Within ±1 day: {predictionAccuracy.withinOneDay}/{predictionAccuracy.totalPredictions}</p>
                  <p>Within ±3 days: {predictionAccuracy.withinThreeDays}/{predictionAccuracy.totalPredictions}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {hasAnyData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Period Days:</span>
                  <span className="font-medium">{monthPeriodDays || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Symptoms Logged:</span>
                  <span className="font-medium">{monthSymptomCount} days</span>
                </div>
                {avgCycleLength && (
                  <div className="flex justify-between text-sm">
                    <span>Avg Cycle Length:</span>
                    <span className="font-medium">{avgCycleLength} days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Symptom Log</DialogTitle>
            <DialogDescription>
              Update your symptoms and notes for {editingLog && format(new Date(editingLog.log_date), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="mb-2">Symptoms</Label>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${symptom}`}
                      checked={editSymptoms.includes(symptom)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditSymptoms([...editSymptoms, symptom]);
                        } else {
                          setEditSymptoms(editSymptoms.filter(s => s !== symptom));
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-${symptom}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deletingItem?.type === 'symptom' ? 'symptom log' : 'period entry'}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
