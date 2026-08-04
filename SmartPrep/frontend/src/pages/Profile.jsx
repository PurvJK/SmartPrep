import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar,
  Code,
  Brain,
  BookOpen,
  Trophy,
  TrendingUp,
  Clock,
  Edit,
  Save,
  X,
  CheckCircle,
  BarChart3,
  Users,
  Plus,
  Settings
} from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { toast } = useToast();

  const academicYearOptions = ['1', '2', '3', '4'];
  const departmentOptions = ['CE', 'CSE', 'IT'];
  const divisionOptions = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProfile();
      if (response.success) {
        setUser(response.data.user);
        setEditForm({
          name: response.data.user.name,
          phone: response.data.user.profile?.phone || '',
          year: response.data.user.profile?.year || '',
          studentId: response.data.user.profile?.studentId || '',
          department: response.data.user.profile?.department || '',
          class: response.data.user.profile?.class || '',
          division: response.data.user.profile?.division || '',
          domain: response.data.user.profile?.domain || response.data.user.profile?.skills || []
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name,
      phone: user.profile?.phone || '',
      year: user.profile?.year || '',
      studentId: user.profile?.studentId || '',
      department: user.profile?.department || '',
      class: user.profile?.class || '',
      division: user.profile?.division || '',
      domain: user.profile?.domain || user.profile?.skills || []
    });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!editForm.name || editForm.name.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiService.updateProfile(editForm);
      if (response.success) {
        setUser(response.data.user);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
      } else {
        // Handle case where response.success is false
        const errorMsg = response.error || (response.errors && response.errors.join(', ')) || response.message || 'Failed to update profile';
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDomainChange = (value) => {
    const domain = value.split(',').map(item => item.trim()).filter(item => item);
    setEditForm(prev => ({
      ...prev,
      domain
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateOverallProgress = () => {
    if (!user?.progress) return 0;
    const { completedQuizzes, totalQuizzes, solvedCodingProblems, totalCodingProblems, studyMaterialsRead } = user.progress;
    
    const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
    const codingProgress = totalCodingProblems > 0 ? (solvedCodingProblems / totalCodingProblems) * 100 : 0;
    const studyProgress = studyMaterialsRead > 0 ? Math.min(studyMaterialsRead * 4, 100) : 0; // Assuming 25 materials = 100%
    
    return Math.round((quizProgress + codingProgress + studyProgress) / 3);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">Unable to load your profile data.</p>
            <Button onClick={fetchUserProfile}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account information and track your progress
              </p>
            </div>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Role</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'faculty' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information - Only for Students */}
            {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    {isEditing ? (
                      <Input
                        id="studentId"
                        value={editForm.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        placeholder="Enter student ID"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.studentId || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Academic Year</Label>
                    {isEditing ? (
                      <Select value={editForm.year || ''} onValueChange={(value) => handleInputChange('year', value)}>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYearOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.year || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Select value={editForm.department || ''} onValueChange={(value) => handleInputChange('department', value)}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.department || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    {isEditing ? (
                      <Input
                        id="class"
                        value={editForm.class}
                        onChange={(e) => handleInputChange('class', e.target.value)}
                        placeholder="Enter class"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.class || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    {isEditing ? (
                      <Select value={editForm.division || ''} onValueChange={(value) => handleInputChange('division', value)}>
                        <SelectTrigger id="division">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisionOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{user.profile?.division || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Domain Information - For All Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Domain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Your Domain</Label>
                  {isEditing ? (
                    <Input
                      id="domain"
                      value={editForm.domain.join(', ')}
                      onChange={(e) => handleDomainChange(e.target.value)}
                      placeholder="Enter domains separated by commas"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                      {(user.profile?.domain || user.profile?.skills || []).length > 0 ? (
                        (user.profile?.domain || user.profile?.skills || []).map((item, index) => (
                          <Badge key={index} variant="outline">{item}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No domain added yet</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <CheckCircle className={`h-4 w-4 ${user.isActive ? 'text-green-500' : 'text-red-500'}`} />
                      <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(user.lastLogin)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(user.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview - Only for Students */}
            {user.role === 'student' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {calculateOverallProgress()}%
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <Progress value={calculateOverallProgress()} className="mt-2" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Quizzes</span>
                      </div>
                      <span className="text-sm font-medium">
                        {user.progress?.completedQuizzes || 0}/{user.progress?.totalQuizzes || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Coding Problems</span>
                      </div>
                      <span className="text-sm font-medium">
                        {user.progress?.solvedCodingProblems || 0}/{user.progress?.totalCodingProblems || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Study Materials</span>
                      </div>
                      <span className="text-sm font-medium">
                        {user.progress?.studyMaterialsRead || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === 'student' ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Button>
                    </Link>
                    <Link to="/study-materials">
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Study Materials
                      </Button>
                    </Link>
                    <Link to="/quizzes">
                      <Button variant="outline" className="w-full justify-start">
                        <Brain className="h-4 w-4 mr-2" />
                        Take Quiz
                      </Button>
                    </Link>
                    <Link to="/coding-practice">
                      <Button variant="outline" className="w-full justify-start">
                        <Code className="h-4 w-4 mr-2" />
                        Practice Coding
                      </Button>
                    </Link>
                  </>
                ) : user.role === 'faculty' ? (
                  <>
                    <Link to="/admin/quizzes">
                      <Button variant="outline" className="w-full justify-start">
                        <Brain className="h-4 w-4 mr-2" />
                        Manage Quizzes
                      </Button>
                    </Link>
                    <Link to="/admin/competitions">
                      <Button variant="outline" className="w-full justify-start">
                        <Trophy className="h-4 w-4 mr-2" />
                        Manage Competitions
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/admin">
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                    <Link to="/admin/users">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                    </Link>
                    <Link to="/admin/content">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Content
                      </Button>
                    </Link>
                    <Link to="/admin/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
