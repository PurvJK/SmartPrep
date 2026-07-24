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
import api from '@/services/api';

const Quizzes = () => {
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.listQuizzes();
        const list = Array.isArray(res) ? res : (res.data || []);
        const available = list.filter(
          quiz => quiz.questions && quiz.questions.length > 0 && quiz.isPublished !== false
        );
        setQuizzes(available);
      } catch (err) {
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // No external API integration

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
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      toast({
        title: 'Quiz not available',
        description: 'This quiz does not have any questions yet.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setTimeLeft(quiz.timeLimit || quiz.questions.length * 60 || 600);
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

          {loading && (
            <p className="text-muted-foreground">Loading quizzes...</p>
          )}

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          {!loading && !error && quizzes.length === 0 && (
            <Card className="p-6 text-center">
              <CardTitle className="text-xl mb-2">No quizzes available yet</CardTitle>
              <p className="text-muted-foreground">Please check back later.</p>
            </Card>
          )}

          {!loading && !error && quizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map(quiz => (
              <Card key={quiz._id} className="hover:shadow-lg transition-shadow">
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
                        <span>{Math.max(1, Math.round((quiz.timeLimit || 600) / 60))} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                        <span>{quiz.questions?.length || 0} questions</span>
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
          )}
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
