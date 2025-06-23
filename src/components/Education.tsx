
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';

export const Education = () => {
  const [activeCategory, setActiveCategory] = useState('pcos-basics');

  const categories = [
    { id: 'pcos-basics', label: 'PCOS Basics', icon: BookOpen },
    { id: 'symptoms', label: 'Symptoms & Signs', icon: AlertTriangle },
    { id: 'management', label: 'Management', icon: Heart },
    { id: 'myths', label: 'Myths & Facts', icon: Lightbulb },
  ];

  const educationContent = {
    'pcos-basics': {
      title: 'Understanding PCOS',
      content: [
        {
          question: 'What is PCOS?',
          answer: 'Polycystic Ovary Syndrome (PCOS) is a hormonal disorder that affects people with ovaries. It\'s one of the most common endocrine disorders, affecting 6-12% of people of reproductive age. Despite its name, not everyone with PCOS has polycystic ovaries.',
          important: true
        },
        {
          question: 'What causes PCOS?',
          answer: 'The exact cause of PCOS is unknown, but it involves a combination of genetic and environmental factors. Insulin resistance, hormonal imbalances (particularly increased androgen levels), and inflammation all play a role in its development.'
        },
        {
          question: 'How is PCOS diagnosed?',
          answer: 'PCOS is typically diagnosed using the Rotterdam criteria, which requires at least 2 of these 3 features: irregular ovulation, elevated androgen levels (or signs of excess androgens), and polycystic ovaries on ultrasound. Other conditions must be ruled out first.'
        },
        {
          question: 'Is PCOS common in South Asian women?',
          answer: 'Yes, PCOS appears to be more common in South Asian women, with prevalence rates ranging from 9.13% to 36%. South Asian women with PCOS may be at higher risk for metabolic complications like diabetes and heart disease.',
          important: true
        }
      ]
    },
    'symptoms': {
      title: 'PCOS Symptoms & Warning Signs',
      content: [
        {
          question: 'What are the main symptoms of PCOS?',
          answer: 'Common symptoms include irregular or missed periods, excess hair growth (hirsutism), acne, weight gain or difficulty losing weight, hair thinning on the scalp, skin darkening (acanthosis nigricans), and mood changes.',
          important: true
        },
        {
          question: 'Menstrual irregularities',
          answer: 'This can include periods that are infrequent (less than 8 periods per year), irregular timing, very light or very heavy bleeding, or complete absence of periods for months. This is often the first sign that leads to diagnosis.'
        },
        {
          question: 'Physical signs to watch for',
          answer: 'Excess hair growth on face, chest, or back; severe acne that doesn\'t respond to usual treatments; dark patches of skin (usually around the neck, armpits, or groin); rapid weight gain, especially around the midsection.'
        },
        {
          question: 'When should I see a doctor?',
          answer: 'See a healthcare provider if you have irregular periods for several months, signs of excess androgens (like excessive hair growth or severe acne), difficulty getting pregnant, or symptoms of diabetes (excessive thirst, frequent urination, fatigue).',
          important: true
        }
      ]
    },
    'management': {
      title: 'Managing PCOS',
      content: [
        {
          question: 'Can PCOS be cured?',
          answer: 'There is no cure for PCOS, but it can be effectively managed through lifestyle changes, medication, and regular monitoring. With proper management, most people with PCOS can live healthy, normal lives and achieve their reproductive goals.'
        },
        {
          question: 'Lifestyle modifications',
          answer: 'Regular exercise (at least 150 minutes per week), a balanced diet low in processed foods and refined carbs, stress management techniques, adequate sleep (7-9 hours), and maintaining a healthy weight can significantly improve PCOS symptoms.',
          important: true
        },
        {
          question: 'Medical treatments',
          answer: 'Treatment varies based on symptoms and goals. Options include hormonal birth control for irregular periods, metformin for insulin resistance, fertility medications if trying to conceive, and anti-androgen medications for excess hair growth.'
        },
        {
          question: 'Cultural considerations for South Asian women',
          answer: 'Consider dietary preferences (incorporating traditional foods like turmeric, fenugreek), family dynamics in treatment decisions, and addressing cultural stigma around reproductive health. Traditional practices like yoga and meditation can complement medical treatment.',
          important: true
        }
      ]
    },
    'myths': {
      title: 'PCOS Myths vs Facts',
      content: [
        {
          question: 'Myth: You can\'t get pregnant with PCOS',
          answer: 'FACT: While PCOS can make it more challenging to conceive naturally, many people with PCOS do get pregnant. With proper treatment and lifestyle modifications, pregnancy is often achievable. Fertility treatments are also available if needed.',
          important: true
        },
        {
          question: 'Myth: PCOS only affects overweight people',
          answer: 'FACT: PCOS affects people of all body types. While weight gain is a common symptom, lean PCOS (affecting normal-weight individuals) is also common, especially in certain populations including South Asians.'
        },
        {
          question: 'Myth: Birth control cures PCOS',
          answer: 'FACT: Birth control can help manage PCOS symptoms like irregular periods and acne, but it doesn\'t cure PCOS. The underlying hormonal imbalances remain, and symptoms typically return when you stop taking birth control.'
        },
        {
          question: 'Myth: PCOS is just a reproductive problem',
          answer: 'FACT: PCOS is a systemic condition that can affect metabolism, cardiovascular health, mental health, and more. It increases the risk of diabetes, heart disease, depression, and other health conditions.',
          important: true
        }
      ]
    }
  };

  const resources = [
    {
      title: 'PCOS Awareness Association',
      description: 'Comprehensive resources and support community',
      url: 'https://pcosaa.org',
      type: 'Organization'
    },
    {
      title: 'Mayo Clinic - PCOS Guide',
      description: 'Medical information and treatment options',
      url: 'https://mayoclinic.org',
      type: 'Medical'
    },
    {
      title: 'South Asian Health Foundation',
      description: 'Culturally relevant health information',
      url: 'https://sahf.org',
      type: 'Cultural'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Learn About PCOS</h2>
        <p className="text-gray-600">Evidence-based information to help you understand and manage PCOS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full justify-start h-auto py-3 ${
                    activeCategory === category.id 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                      : 'text-gray-600 hover:text-pink-600'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="text-left">{category.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {educationContent[activeCategory as keyof typeof educationContent].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {educationContent[activeCategory as keyof typeof educationContent].content.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center space-x-2">
                        <span>{item.question}</span>
                        {item.important && (
                          <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">
                            Important
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 pt-2 pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <ExternalLink className="w-5 h-5 mr-2" />
                Additional Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource, index) => (
                  <Card key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-blue-900">{resource.title}</h4>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700">{resource.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-2">Medical Disclaimer</p>
                  <p>
                    This information is for educational purposes only and should not replace professional medical advice. 
                    Always consult with a qualified healthcare provider for diagnosis and treatment of PCOS or any other medical condition.
                    If you suspect you have PCOS, please see a healthcare professional for proper evaluation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
