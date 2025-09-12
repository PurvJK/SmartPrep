import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Clock, 
  Trophy, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Quizzes = () => {
  const [user, setUser] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // Sample quiz data
  const quizzes = [
    {
      id: 1,
      title: 'Data Structures Basics',
      category: 'DSA',
      difficulty: 'Easy',
      timeLimit: 600,
      description: 'Test your knowledge of basic data structures',
      questions: [
        {
          id: 1,
          question: 'What is the time complexity of accessing an element in an array by index?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
          correctAnswer: 0,
          explanation: 'Array elements can be accessed directly using their index, which takes constant time O(1).'
        },
        {
          id: 2,
          question: 'Which data structure follows LIFO principle?',
          options: ['Queue', 'Stack', 'Array', 'Linked List'],
          correctAnswer: 1,
          explanation: 'Stack follows Last In First Out (LIFO) principle where the last element added is the first one to be removed.'
        },
        {
          id: 3,
          question: 'In a linked list, what is the time complexity of inserting at the beginning?',
          options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
          correctAnswer: 1,
          explanation: 'Inserting at the beginning of a linked list only requires updating the head pointer, which takes O(1) time.'
        }
      ]
    },
    {
      id: 2,
      title: 'Operating System Fundamentals',
      category: 'OS',
      difficulty: 'Medium',
      timeLimit: 900,
      description: 'Test your understanding of OS concepts',
      questions: [
        {
          id: 1,
          question: 'What is a deadlock in operating systems?',
          options: [
            'A process that never terminates',
            'A situation where processes wait for each other indefinitely',
            'A memory allocation error',
            'A CPU scheduling algorithm'
          ],
          correctAnswer: 1,
          explanation: 'Deadlock occurs when processes are blocked forever, waiting for each other to release resources.'
        },
        {
          id: 2,
          question: 'Which scheduling algorithm gives the shortest average waiting time?',
          options: ['FCFS', 'SJF', 'Round Robin', 'Priority'],
          correctAnswer: 1,
          explanation: 'Shortest Job First (SJF) gives the minimum average waiting time among all scheduling algorithms.'
        }
      ]
    },
    {
      id: 3,
      title: 'Quantitative Aptitude',
      category: 'Aptitude',
      difficulty: 'Easy',
      timeLimit: 480,
      description: 'Basic mathematical reasoning and problem solving',
      questions: [
        {
          id: 1,
          question: 'If 20% of a number is 50, what is the number?',
          options: ['200', '250', '300', '150'],
          correctAnswer: 1,
          explanation: 'If 20% of x = 50, then x = 50 × (100/20) = 250'
        },
        {
          id: 2,
          question: 'A train travels 60 km in 40 minutes. What is its speed in km/h?',
          options: ['80 km/h', '90 km/h', '100 km/h', '120 km/h'],
          correctAnswer: 1,
          explanation: 'Speed = Distance/Time = 60 km ÷ (40/60) hours = 60 ÷ (2/3) = 90 km/h'
        }
      ]
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (selectedQuiz && timeLeft > 0 && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedQuiz && !quizCompleted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, selectedQuiz, quizCompleted]);

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setTimeLeft(quiz.timeLimit);
    setQuizCompleted(false);
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedQuiz) return;

    let correctAnswers = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === selectedQuiz.questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setQuizCompleted(true);
    setShowResults(true);

    toast({
      title: "Quiz Completed!",
      description: `You scored ${correctAnswers}/${selectedQuiz.questions.length}`
    });
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setTimeLeft(0);
    setQuizCompleted(false);
    setShowResults(false);
    setScore(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ----- UI Rendering -----
  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">MCQ Quizzes</h1>
            <p className="text-muted-foreground">
              Test your knowledge with timed quizzes and track your progress
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Brain className="h-8 w-8 text-primary" />
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(quiz.timeLimit / 60)} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{quiz.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{quiz.category}</Badge>
                    <Button onClick={() => startQuiz(quiz)}>
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-primary mb-2">
                  {Math.round((score / selectedQuiz.questions.length) * 100)}%
                </div>
                <p className="text-xl text-muted-foreground">
                  You got {score} out of {selectedQuiz.questions.length} questions correct
                </p>
              </div>

              {/* Results breakdown */}
              <div className="space-y-4 mb-8">
                {selectedQuiz.questions.map((question, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start space-x-3">
                      {selectedAnswers[index] === question.correctAnswer ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">{question.question}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                        {selectedAnswers[index] !== question.correctAnswer && (
                          <p className="text-sm text-red-600 mb-2">
                            Your answer: {selectedAnswers[index] >= 0 ? question.options[selectedAnswers[index]] : 'Not answered'}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex space-x-4 justify-center">
                <Button onClick={resetQuiz} variant="outline">
                  Back to Quizzes
                </Button>
                <Button onClick={() => startQuiz(selectedQuiz)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz taking interface
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">{selectedQuiz.title}</h1>
            <div className="flex items-center space-x-2 text-lg font-medium">
              <Clock className="h-5 w-5 text-primary" />
              <span className={timeLeft < 60 ? 'text-red-500' : 'text-foreground'}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {selectedQuiz.questions.length}
            </div>
            <Button variant="outline" onClick={resetQuiz}>
              Exit Quiz
            </Button>
          </div>
          
          <Progress 
            value={(currentQuestion + 1) / selectedQuiz.questions.length * 100} 
            className="h-2"
          />
        </div>

        {/* Question */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-medium mb-6">
              {selectedQuiz.questions[currentQuestion].question}
            </h2>
            
            <div className="space-y-3">
              {selectedQuiz.questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswers[currentQuestion] === index ? 'default' : 'outline'}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="font-medium mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="flex space-x-4">
            {currentQuestion === selectedQuiz.questions.length - 1 ? (
              <Button onClick={handleSubmitQuiz}>
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {selectedQuiz.questions.map((_, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={
                    index === currentQuestion ? 'default' : 
                    selectedAnswers[index] >= 0 ? 'outline' : 'ghost'
                  }
                  className={`h-10 w-10 p-0 ${
                    selectedAnswers[index] >= 0 ? 'bg-green-100 border-green-300' : ''
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quizzes;
