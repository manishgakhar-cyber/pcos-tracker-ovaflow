
import { useState } from 'react';
import { Calendar, BookOpen, TrendingUp, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SymptomTracker } from '@/components/SymptomTracker';
import { CycleCalendar } from '@/components/CycleCalendar';
import { Dashboard } from '@/components/Dashboard';
import { Education } from '@/components/Education';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'symptoms', label: 'Log Symptoms', icon: Plus },
    { id: 'education', label: 'Learn', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <CycleCalendar />;
      case 'symptoms':
        return <SymptomTracker />;
      case 'education':
        return <Education />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Mobile-optimized Header */}
      <header className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🌸</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                CycleWise
              </h1>
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-pink-100">
              <h2 className="font-semibold text-gray-900">Navigation</h2>
            </div>
            <nav className="p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full justify-start h-12 text-left ${
                        activeTab === tab.id 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                          : 'text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-4 overflow-auto">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bg-white border-t border-pink-100 px-4 py-2 md:hidden sticky bottom-0 z-50">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 p-2 h-auto min-w-0 flex-1 ${
                  activeTab === tab.id 
                    ? 'text-pink-600' 
                    : 'text-gray-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-pink-600' : 'text-gray-500'}`} />
                <span className={`text-xs ${activeTab === tab.id ? 'text-pink-600 font-medium' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
