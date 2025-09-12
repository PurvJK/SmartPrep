import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Lightbulb } from 'lucide-react';

const InterviewPrep = () => {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('HR');

  const hrQuestions = [
    "Tell me about yourself",
    "Why do you want to work here?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?"
  ];

  const technicalQuestions = [
    "Explain the difference between overloading and overriding",
    "What is the time complexity of binary search?",
    "Explain the SOLID principles",
    "What is a deadlock in operating systems?",
    "Difference between SQL and NoSQL databases"
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interview Preparation</h1>
          <p className="text-muted-foreground">Practice HR and technical interview questions</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <Button 
            variant={selectedCategory === 'HR' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('HR')}
          >
            <Users className="h-4 w-4 mr-2" />
            HR Questions
          </Button>
          <Button 
            variant={selectedCategory === 'Technical' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Technical')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Technical Questions
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(selectedCategory === 'HR' ? hrQuestions : technicalQuestions).map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  Question {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{question}</p>
                <Badge variant="outline">{selectedCategory}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
