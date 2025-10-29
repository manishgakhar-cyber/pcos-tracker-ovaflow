
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
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
  
  // Calculate average cycle length from completed cycles
  const completedCycles = cycleData.filter(cycle => cycle.cycle_length).sort((a, b) => 
    new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
  );
  const avgCycleLength = completedCycles.length > 0 
    ? Math.round(completedCycles.reduce((sum, cycle) => sum + cycle.cycle_length, 0) / completedCycles.length)
    : null;

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
                          info.dayType === 'symptoms' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {info.dayType === 'period' ? 'Period' :
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
