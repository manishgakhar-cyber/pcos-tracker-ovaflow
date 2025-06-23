
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export const CycleCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock data - in a real app, this would come from user's logged data
  const mockCycleData = {
    periodDays: [
      new Date(2024, 11, 1),
      new Date(2024, 11, 2),
      new Date(2024, 11, 3),
      new Date(2024, 11, 4),
      new Date(2024, 11, 5),
    ],
    ovulationDays: [
      new Date(2024, 11, 14),
      new Date(2024, 11, 15),
    ],
    symptomDays: [
      { date: new Date(2024, 11, 8), symptoms: ['Mood swings', 'Bloating'] },
      { date: new Date(2024, 11, 12), symptoms: ['Acne', 'Fatigue'] },
      { date: new Date(2024, 11, 20), symptoms: ['Headache'] },
    ],
    fertileWindow: [
      new Date(2024, 11, 12),
      new Date(2024, 11, 13),
      new Date(2024, 11, 14),
      new Date(2024, 11, 15),
      new Date(2024, 11, 16),
    ]
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayType = (day: Date) => {
    if (mockCycleData.periodDays.some(d => isSameDay(d, day))) {
      return 'period';
    }
    if (mockCycleData.ovulationDays.some(d => isSameDay(d, day))) {
      return 'ovulation';
    }
    if (mockCycleData.fertileWindow.some(d => isSameDay(d, day))) {
      return 'fertile';
    }
    if (mockCycleData.symptomDays.some(d => isSameDay(d.date, day))) {
      return 'symptoms';
    }
    return 'normal';
  };

  const getDaySymptoms = (day: Date) => {
    const symptomDay = mockCycleData.symptomDays.find(d => isSameDay(d.date, day));
    return symptomDay?.symptoms || [];
  };

  const getDayStyles = (day: Date, type: string) => {
    const baseStyles = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer";
    
    switch (type) {
      case 'period':
        return `${baseStyles} bg-red-500 text-white hover:bg-red-600`;
      case 'ovulation':
        return `${baseStyles} bg-blue-500 text-white hover:bg-blue-600`;
      case 'fertile':
        return `${baseStyles} bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300`;
      case 'symptoms':
        return `${baseStyles} bg-orange-100 text-orange-800 hover:bg-orange-200 border-2 border-orange-300`;
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
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Ovulation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-300 border-2 border-green-400 rounded-full"></div>
                <span className="text-sm">Fertile Window</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-300 border-2 border-orange-400 rounded-full"></div>
                <span className="text-sm">Symptoms Logged</span>
              </div>
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
                          info.dayType === 'ovulation' ? 'bg-blue-100 text-blue-800' :
                          info.dayType === 'fertile' ? 'bg-green-100 text-green-800' :
                          info.dayType === 'symptoms' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {info.dayType === 'period' ? 'Period' :
                           info.dayType === 'ovulation' ? 'Ovulation' :
                           info.dayType === 'fertile' ? 'Fertile Window' :
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Period Days:</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Symptoms Logged:</span>
                <span className="font-medium">3 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cycle Length:</span>
                <span className="font-medium">28 days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
