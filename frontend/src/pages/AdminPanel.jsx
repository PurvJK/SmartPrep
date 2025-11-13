import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, BookOpen, Brain, Plus } from 'lucide-react';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'student' },
    { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'admin' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, content, and quizzes</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button 
            variant={activeTab === 'content' ? 'default' : 'outline'}
            onClick={() => setActiveTab('content')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </Button>
          <Button 
            variant={activeTab === 'quizzes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('quizzes')}
          >
            <Brain className="h-4 w-4 mr-2" />
            Quizzes
          </Button>
        </div>

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {user.role}
                      </span>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'content' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Content Title" />
                <Input placeholder="Category" />
                <Textarea placeholder="Content Description" />
                <Button>Save Content</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'quizzes' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quiz Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Quiz Title" />
                <Input placeholder="Category" />
                <Input placeholder="Time Limit (minutes)" type="number" />
                <Textarea placeholder="Quiz Description" />
                <Button>Save Quiz</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
