import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, BookOpen, Brain, Plus } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materialForm, setMaterialForm] = useState({
    title: '',
    category: '',
    description: '',
    readTime: '',
    difficulty: 'Easy',
    content: '',
    images: '',
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [theoryDocs, setTheoryDocs] = useState([]);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryError, setTheoryError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Sync active tab with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/content')) setActiveTab('content');
    else if (path.includes('/admin/quizzes')) setActiveTab('quizzes');
    else if (path.includes('/admin/users')) setActiveTab('users');
    else if (path.includes('/admin')) setActiveTab('users');
  }, [location.pathname]);

  // Fetch StudyTheory when content tab is active
  useEffect(() => {
    const fetchTheory = async () => {
      if (activeTab !== 'content') return;
      try {
        setTheoryLoading(true);
        setTheoryError('');
        const res = await api.getStudyTheory();
        // when no category param, returns { success, data: docs[] }
        const docs = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
        setTheoryDocs(docs);
      } catch (e) {
        setTheoryError(e.message || 'Failed to load theory');
      } finally {
        setTheoryLoading(false);
      }
    };
    fetchTheory();
  }, [activeTab]);

  const uploadToCloudinary = async (files) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Missing Cloudinary config. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
    }
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cloudinary upload failed: ${text}`);
      }
      const data = await res.json();
      urls.push(data.secure_url || data.url);
    }
    return urls;
  };

  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users') return;
      try {
        setUsersLoading(true);
        setUsersError('');
        const res = await api.getAllUsers(1, 50);
        // backend returns { success, data: { users, pagination } }
        const list = res.data?.users || [];
        setUsersList(list);
      } catch (e) {
        setUsersError(e.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [activeTab]);

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
            onClick={() => { setActiveTab('users'); navigate('/admin/users'); }}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button 
            variant={activeTab === 'content' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('content'); navigate('/admin/content'); }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </Button>
          <Button 
            variant={activeTab === 'quizzes' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('quizzes'); navigate('/admin/quizzes'); }}
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
              {usersLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
              {usersError && <p className="text-sm text-red-600">{usersError}</p>}
              {!usersLoading && !usersError && (
                <div className="space-y-4">
                  {usersList.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                          {u.role}
                        </span>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'content' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Management</CardTitle>
                <Button onClick={async () => {
                  try {
                    const payload = {
                      ...materialForm,
                      images: materialForm.images
                        ? materialForm.images.split(',').map(s => s.trim()).filter(Boolean)
                        : [],
                    };
                    const res = await api.createStudyMaterial(payload);
                    if (res.success) {
                      toast({ title: 'Created', description: 'Study material added.' });
                      setMaterialForm({ title: '', category: '', description: '', readTime: '', difficulty: 'Easy', content: '', images: '' });
                      // refresh list
                      try { const ref = await api.listStudyMaterials(); setMaterials(ref.data || []);} catch {}
                    }
                  } catch (e) {
                    toast({ title: 'Error', description: e.message || 'Failed to add material', variant: 'destructive' });
                  }
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Content Title" value={materialForm.title} onChange={e => setMaterialForm(v => ({ ...v, title: e.target.value }))} />
                <Input placeholder="Category (e.g., DSA, OS, DBMS)" value={materialForm.category} onChange={e => setMaterialForm(v => ({ ...v, category: e.target.value }))} />
                <Input placeholder="Read Time (e.g., 45 min)" value={materialForm.readTime} onChange={e => setMaterialForm(v => ({ ...v, readTime: e.target.value }))} />
                <Input placeholder="Difficulty (Easy, Medium, Hard)" value={materialForm.difficulty} onChange={e => setMaterialForm(v => ({ ...v, difficulty: e.target.value }))} />
                <Textarea placeholder="Content Description" value={materialForm.description} onChange={e => setMaterialForm(v => ({ ...v, description: e.target.value }))} />
                <Textarea placeholder="Content (markdown/text)" value={materialForm.content} onChange={e => setMaterialForm(v => ({ ...v, content: e.target.value }))} />
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Upload Images (Cloudinary)</label>
                  <input type="file" accept="image/*" multiple onChange={async (e) => {
                    try {
                      if (!e.target.files || e.target.files.length === 0) return;
                      setUploading(true);
                      const urls = await uploadToCloudinary([...e.target.files]);
                      setUploadedImages(prev => [...prev, ...urls]);
                      toast({ title: 'Uploaded', description: `${urls.length} image(s) uploaded.` });
                    } catch (err) {
                      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }} />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                  {uploadedImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="preview" className="h-16 w-16 object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={async () => {
                  try {
                    // Map Admin form to StudyTheory upsert: store images in sections[0]
                    const sections = uploadedImages.length > 0 ? [
                      { heading: materialForm.title || 'Overview', items: [materialForm.description].filter(Boolean), image: uploadedImages[0] }
                    ] : [];
                    const res = await api.upsertStudyTheory({
                      category: materialForm.category,
                      title: materialForm.title,
                      description: materialForm.description,
                      content: materialForm.content,
                      sections,
                    });
                    if (res.success) {
                      toast({ title: editingId ? 'Updated' : 'Saved', description: 'Study theory saved.' });
                      setEditingId(null);
                      setMaterialForm({ title: '', category: '', description: '', readTime: '', difficulty: 'Easy', content: '', images: '' });
                      setUploadedImages([]);
                      try { const ref = await api.getStudyTheory(); const docs = Array.isArray(ref.data) ? ref.data : (ref.data ? [ref.data] : []); setTheoryDocs(docs);} catch {}
                    }
                  } catch (e) {
                    toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
                  }
                }}>Save Content</Button>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-3">All Materials</h3>
                {theoryLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {theoryError && <p className="text-sm text-red-600">{theoryError}</p>}
                {!theoryLoading && !theoryError && (
                  <div className="space-y-3">
                    {theoryDocs.map(m => (
                      <div key={m._id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{m.title}</p>
                            <p className="text-sm text-muted-foreground">{m.category}</p>
                            <p className="text-sm mt-1 line-clamp-2">{m.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingId(m._id);
                              setMaterialForm({
                                title: m.title || '',
                                category: m.category || '',
                                description: m.description || '',
                                content: m.content || '',
                                images: '',
                              });
                              const firstImage = (m.sections && m.sections[0] && m.sections[0].image) ? [m.sections[0].image] : [];
                              setUploadedImages(firstImage);
                            }}>Edit</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {theoryDocs.length === 0 && (
                      <p className="text-sm text-muted-foreground">No content yet.</p>
                    )}
                  </div>
                )}
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
