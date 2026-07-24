import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Users, Lightbulb, ChevronDown, ChevronUp, Plus, Edit, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const InterviewPrep = () => {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('HR');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'HR',
    subcategory: '',
    difficulty: 'Medium',
    tags: '',
    tips: '',
    examples: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadQuestions();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.listInterviewQuestions({ 
        category: selectedCategory,
        includeUnpublished: user?.role === 'admin'
      });
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interview questions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleAddQuestion = () => {
    setFormData({
      question: '',
      answer: '',
      category: selectedCategory,
      subcategory: '',
      difficulty: 'Medium',
      tags: '',
      tips: '',
      examples: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      answer: question.answer,
      category: question.category,
      subcategory: question.subcategory || '',
      difficulty: question.difficulty || 'Medium',
      tags: question.tags?.join(', ') || '',
      tips: question.tips || '',
      examples: question.examples || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Question and answer are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const questionData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        difficulty: formData.difficulty,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        tips: formData.tips.trim(),
        examples: formData.examples.trim()
      };

      if (editingQuestion) {
        await api.updateInterviewQuestion(editingQuestion._id, questionData);
        toast({
          title: 'Success',
          description: 'Question updated successfully'
        });
        setIsEditDialogOpen(false);
      } else {
        await api.createInterviewQuestion(questionData);
        toast({
          title: 'Success',
          description: 'Question added successfully'
        });
        setIsAddDialogOpen(false);
      }

      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save question',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.deleteInterviewQuestion(questionId);
      toast({
        title: 'Success',
        description: 'Question deleted successfully'
      });
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete question',
        variant: 'destructive'
      });
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Interview Preparation</h1>
            <p className="text-muted-foreground">Practice HR and technical interview questions</p>
          </div>
          {user?.role === 'admin' && (
            <Button onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No {selectedCategory} questions available yet.
                {user?.role === 'admin' && ' Click "Add Question" to get started!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((question) => {
              const isExpanded = expandedQuestions.has(question._id);
              return (
                <Card key={question._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center flex-1">
                        <Lightbulb className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                        <span className="line-clamp-2">{question.question}</span>
                      </CardTitle>
                      {user?.role === 'admin' && (
                        <div className="flex space-x-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{question.category}</Badge>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      {question.subcategory && (
                        <Badge variant="secondary">{question.subcategory}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1">
                      {isExpanded ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-foreground">Answer:</h4>
                            <p className="text-foreground whitespace-pre-wrap">{question.answer}</p>
                          </div>
                          {question.tips && (
                            <div>
                              <h4 className="font-semibold mb-2 text-foreground">Tips:</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{question.tips}</p>
                            </div>
                          )}
                          {question.examples && (
                            <div>
                              <h4 className="font-semibold mb-2 text-foreground">Examples:</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{question.examples}</p>
                            </div>
                          )}
                          {question.tags && question.tags.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-foreground">Tags:</h4>
                              <div className="flex flex-wrap gap-1">
                                {question.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground line-clamp-3">
                          Click to view answer and details...
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => toggleAnswer(question._id)}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Answer
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Interview Question</DialogTitle>
            <DialogDescription>
              Add a new {selectedCategory} interview question with answer and details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the interview question"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter a comprehensive answer"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., JavaScript, System Design"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., arrays, algorithms, oop"
              />
            </div>
            <div>
              <Label htmlFor="tips">Tips</Label>
              <Textarea
                id="tips"
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                placeholder="Additional tips for answering this question"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="examples">Examples</Label>
              <Textarea
                id="examples"
                value={formData.examples}
                onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                placeholder="Code examples or real-world examples"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Question'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Interview Question</DialogTitle>
            <DialogDescription>
              Update the interview question and answer details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-question">Question *</Label>
              <Textarea
                id="edit-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the interview question"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer">Answer *</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter a comprehensive answer"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subcategory">Subcategory</Label>
                <Input
                  id="edit-subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., JavaScript, System Design"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., arrays, algorithms, oop"
              />
            </div>
            <div>
              <Label htmlFor="edit-tips">Tips</Label>
              <Textarea
                id="edit-tips"
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                placeholder="Additional tips for answering this question"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-examples">Examples</Label>
              <Textarea
                id="edit-examples"
                value={formData.examples}
                onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                placeholder="Code examples or real-world examples"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Question'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewPrep;
