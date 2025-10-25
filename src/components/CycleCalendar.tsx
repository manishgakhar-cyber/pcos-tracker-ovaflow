
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const CycleCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
  const [cycleData, setCycleData] = useState<any[]>([]);

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
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayType = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Check if there are symptoms logged
    const hasSymptoms = symptomLogs.some(log => log.log_date === dayStr);
    if (hasSymptoms) {
      return 'symptoms';
    }
    
    // Check if it's a period day
    const isPeriodDay = cycleData.some(cycle => {
      const startDate = new Date(cycle.period_start_date);
      const endDate = cycle.period_end_date ? new Date(cycle.period_end_date) : startDate;
      return day >= startDate && day <= endDate;
    });
    if (isPeriodDay) {
      return 'period';
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
    
    return { dayType, symptoms };
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
  const monthSymptomCount = symptomLogs.filter(log => {
    const logDate = new Date(log.log_date);
    return isSameMonth(logDate, currentMonth);
  }).length;
  
  const monthPeriodDays = cycleData.filter(cycle => {
    const startDate = new Date(cycle.period_start_date);
    return isSameMonth(startDate, currentMonth);
  }).reduce((total, cycle) => {
    const endDate = cycle.period_end_date ? new Date(cycle.period_end_date) : new Date(cycle.period_start_date);
    const startDate = new Date(cycle.period_start_date);
    return total + Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);

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
                
                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`${getDayStyles(day, dayType)} ${
                      isToday ? 'ring-2 ring-purple-400' : ''
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
                {cycleData.length > 0 && cycleData[0].cycle_length && (
                  <div className="flex justify-between text-sm">
                    <span>Cycle Length:</span>
                    <span className="font-medium">{cycleData[0].cycle_length} days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
