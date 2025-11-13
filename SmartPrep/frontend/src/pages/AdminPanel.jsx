import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Brain, Plus, Upload, X, Save, Edit, Trash2, Bold, Italic, Underline, List, Type, Code, Minus, Plus as PlusIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Fetch Theory when content tab is active
  useEffect(() => {
    const fetchTheory = async () => {
      if (activeTab !== 'content') return;
      try {
        setTheoryLoading(true);
        setTheoryError('');
        const res = await api.listTheory();
        const docs = Array.isArray(res) ? res : (res.data || []);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add/Edit Form */}
            <Card data-form-card>
            <CardHeader>
                <CardTitle>
                  {editingId ? 'Edit Study Material' : 'Add New Study Material'}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Array Data Structure"
                      value={materialForm.title}
                      onChange={e => setMaterialForm(v => ({ ...v, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={materialForm.category}
                      onValueChange={(value) => setMaterialForm(v => ({ ...v, category: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DSA">DSA</SelectItem>
                        <SelectItem value="OS">Operating Systems</SelectItem>
                        <SelectItem value="DBMS">Database Management</SelectItem>
                        <SelectItem value="Aptitude">Aptitude</SelectItem>
                        <SelectItem value="Programming">Programming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={materialForm.difficulty}
                      onValueChange={(value) => setMaterialForm(v => ({ ...v, difficulty: value }))}
                    >
                      <SelectTrigger id="difficulty">
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the topic"
                      value={materialForm.description}
                      onChange={e => setMaterialForm(v => ({ ...v, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Theory Content</Label>
                    <div className="border rounded-md">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
                        {/* Text Formatting */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `**${selectedText}**` : '****') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 2 : 0),
                                  end + (selectedText ? 2 : 0)
                                );
                              }, 0);
                            }}
                            title="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `*${selectedText}*` : '**') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 1 : 0),
                                  end + (selectedText ? 1 : 0)
                                );
                              }, 0);
                            }}
                            title="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `<u>${selectedText}</u>` : '<u></u>') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 3 : 0),
                                  end + (selectedText ? 3 : 0)
                                );
                              }, 0);
                            }}
                            title="Underline"
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Text Size Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1;
                              }
                              
                              const line = lines[lineIndex];
                              if (line.startsWith('### ')) {
                                lines[lineIndex] = '## ' + line.substring(4);
                              } else if (line.startsWith('## ')) {
                                lines[lineIndex] = '# ' + line.substring(3);
                              } else if (line.startsWith('# ')) {
                                // Already largest
                              } else {
                                lines[lineIndex] = '# ' + line;
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start + (line.startsWith('#') ? 0 : 2);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Increase Text Size (Heading)"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <Type className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1;
                              }
                              
                              const line = lines[lineIndex];
                              if (line.startsWith('# ')) {
                                lines[lineIndex] = '## ' + line.substring(2);
                              } else if (line.startsWith('## ')) {
                                lines[lineIndex] = '### ' + line.substring(3);
                              } else if (line.startsWith('### ')) {
                                lines[lineIndex] = line.substring(4); // Remove heading
                              } else {
                                // Already normal text
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start - (line.startsWith('#') ? 1 : 0);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Decrease Text Size"
                          >
                            <Minus className="h-4 w-4" />
                            <Type className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* List and Code */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              
                              if (selectedText) {
                                // Wrap selected text in code block
                                const codeBlock = `\`\`\`\n${selectedText}\n\`\`\``;
                                const newText = materialForm.content.substring(0, start) +
                                  codeBlock +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + 4, start + 4 + selectedText.length);
                                }, 0);
                              } else {
                                // Insert empty code block
                                const codeBlock = `\`\`\`\n// Your code here\n\`\`\``;
                                const newText = materialForm.content.substring(0, start) +
                                  codeBlock +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  const codeStart = start + 4;
                                  const codeEnd = codeStart + 18; // "// Your code here"
                                  textarea.setSelectionRange(codeStart, codeEnd);
                                }, 0);
                              }
                            }}
                            title="Add Code Block"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              
                              if (selectedText) {
                                // Wrap selected text in inline code
                                const inlineCode = `\`${selectedText}\``;
                                const newText = materialForm.content.substring(0, start) +
                                  inlineCode +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(
                                    start + 1,
                                    end + 1
                                  );
                                }, 0);
                              } else {
                                // Insert empty inline code
                                const inlineCode = '``';
                                const newText = materialForm.content.substring(0, start) +
                                  inlineCode +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + 1, start + 1);
                                }, 0);
                              }
                            }}
                            title="Add Inline Code"
                          >
                            <Code className="h-4 w-4" />
                            <span className="text-xs ml-1">inline</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1; // +1 for newline
                              }
                              
                              const line = lines[lineIndex];
                              if (!line.trim().startsWith('- ')) {
                                lines[lineIndex] = '- ' + line;
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start + (line.trim().startsWith('- ') ? 0 : 2);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Bullet Point"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="content"
                        placeholder="Write your theory content here. Use the toolbar above for formatting."
                        value={materialForm.content}
                        onChange={e => setMaterialForm(v => ({ ...v, content: e.target.value }))}
                        className="min-h-[250px] border-0 focus-visible:ring-0"
                        rows={12}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the toolbar buttons to format text: Bold, Italic, Underline, Text Size (Headings), Code Blocks, and Bullet Points. Images can be added in the Images tab below.
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Images & Preview</Label>
                    <Tabs defaultValue="images" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="images">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Preview Content
                        </TabsTrigger>
                      </TabsList>
                    <TabsContent value="images" className="space-y-3">
                <div>
                        <Label>Upload Images</Label>
                        <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload').click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Choose Images'}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                    try {
                      if (!e.target.files || e.target.files.length === 0) return;
                      setUploading(true);
                            
                            // Try backend upload first, fallback to Cloudinary
                            let urls = [];
                            try {
                              const formData = new FormData();
                              Array.from(e.target.files).forEach(file => {
                                formData.append('images', file);
                              });
                              const result = await api.uploadTheoryImages(Array.from(e.target.files));
                              urls = result.urls || [];
                            } catch (backendError) {
                              // Fallback to Cloudinary
                              urls = await uploadToCloudinary([...e.target.files]);
                            }
                            
                      setUploadedImages(prev => [...prev, ...urls]);
                            toast({ 
                              title: 'Uploaded', 
                              description: `${urls.length} image(s) uploaded successfully.` 
                            });
                    } catch (err) {
                            toast({ 
                              title: 'Upload failed', 
                              description: err.message, 
                              variant: 'destructive' 
                            });
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                        }}
                      />
                        </div>

                  {uploadedImages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <Label>Uploaded Images ({uploadedImages.length})</Label>
                            <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((url, i) => (
                                <div key={i} className="relative group">
                                  <img 
                                    src={url} 
                                    alt={`Preview ${i + 1}`} 
                                    className="h-20 w-full object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setUploadedImages(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="absolute bottom-1 left-1 h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-index={i}
                                    onClick={(e) => {
                                      const imageMarkdown = `![](${url})`;
                                      const textarea = document.getElementById('content');
                                      const cursorPos = textarea.selectionStart;
                                      const newContent = 
                                        materialForm.content.substring(0, cursorPos) +
                                        `\n\n${imageMarkdown}\n\n` +
                                        materialForm.content.substring(cursorPos);
                                      setMaterialForm(v => ({ ...v, content: newContent }));
                                      toast({ 
                                        title: 'Inserted', 
                                        description: 'Image inserted at cursor position' 
                                      });
                                    }}
                                  >
                                    Insert
                                  </Button>
                        </div>
                      ))}
                    </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const imageMarkdown = uploadedImages.map(url => `![](${url})`).join('\n\n');
                                setMaterialForm(v => ({
                                  ...v,
                                  content: v.content ? `${v.content}\n\n${imageMarkdown}` : imageMarkdown
                                }));
                                toast({ 
                                  title: 'Added', 
                                  description: 'All images inserted into content' 
                                });
                              }}
                            >
                              Insert All Images at End
                            </Button>
                          </div>
                        </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-3">
                      <div>
                        <Label>Content Preview</Label>
                        <div className="border rounded-md p-4 min-h-[200px] bg-muted/30">
                          {materialForm.content ? (
                            <div className="prose max-w-none">
                              {(() => {
                                // Split content by code blocks
                                const parts = materialForm.content.split(/(```[\s\S]*?```)/g);
                                return parts.map((part, idx) => {
                                  // Check if this is a code block
                                  if (part.startsWith('```') && part.endsWith('```')) {
                                    const codeContent = part.slice(3, -3).trim();
                                    const lines = codeContent.split('\n');
                                    const language = lines[0] || '';
                                    const code = lines.slice(1).join('\n') || lines[0];
                                    
                                    // Basic syntax highlighting for JavaScript/TypeScript
                                    const highlightCode = (codeText) => {
                                      // Escape HTML first to prevent issues
                                      const escapeHtml = (text) => {
                                        const map = {
                                          '&': '&amp;',
                                          '<': '&lt;',
                                          '>': '&gt;',
                                          '"': '&quot;',
                                          "'": '&#039;'
                                        };
                                        return text.replace(/[&<>"']/g, m => map[m]);
                                      };
                                      
                                      const escaped = escapeHtml(codeText);
                                      
                                      return escaped
                                        // Comments first (before other processing)
                                        .replace(/(\/\/.*$)/gm, '<span style="color: #6b7280;">$1</span>')
                                        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6b7280;">$1</span>')
                                        // Strings
                                        .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)(\1)/g, '<span style="color: #fde047;">$1$2$3</span>')
                                        // Keywords
                                        .replace(/\b(useEffect|useState|const|let|var|function|if|else|return|import|export|from|default|async|await|try|catch|finally|for|while|do|switch|case|break|continue|new|this|class|extends|super)\b/g, '<span style="color: #22d3ee;">$1</span>')
                                        // Numbers
                                        .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #a78bfa;">$1</span>')
                                        // Function calls (but not keywords)
                                        .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (match, funcName) => {
                                          const keywords = ['useEffect', 'useState', 'const', 'let', 'var', 'function', 'if', 'else', 'return', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'super'];
                                          if (keywords.includes(funcName)) {
                                            return match;
                                          }
                                          return `<span style="color: #fb923c;">${funcName}</span> `;
                                        })
                                        // Operators and brackets
                                        .replace(/([{}()[\]])/g, '<span style="color: #d1d5db;">$1</span>');
                                    };
                                    
                                    return (
                                      <pre key={idx} className="bg-[#1e1e1e] dark:bg-[#0d1117] p-4 rounded-md overflow-x-auto my-4 border border-gray-700">
                                        <code 
                                          className="text-sm font-mono whitespace-pre block"
                                          style={{ color: '#e5e7eb' }}
                                          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
                                        />
                                      </pre>
                                    );
                                  }
                                  
                                  // Regular content - process markdown
                                  return (
                                    <div 
                                      key={idx}
                                      className="text-sm"
                                      dangerouslySetInnerHTML={{ 
                                        __html: part
                                          .split('\n')
                                          .map(line => {
                                            let processed = line;
                                            
                                            // Bold: **text**
                                            processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            
                                            // Italic: *text* (but not **)
                                            processed = processed.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
                                            
                                            // Underline: <u>text</u>
                                            processed = processed.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
                                            
                                            // Inline code (`code`)
                                            processed = processed.replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
                                            
                                            // Headers
                                            if (processed.trim().startsWith('# ')) {
                                              return `<h1 class="text-2xl font-bold mt-4 mb-2">${processed.substring(2)}</h1>`;
                                            }
                                            if (processed.trim().startsWith('## ')) {
                                              return `<h2 class="text-xl font-bold mt-3 mb-2">${processed.substring(3)}</h2>`;
                                            }
                                            if (processed.trim().startsWith('### ')) {
                                              return `<h3 class="text-lg font-semibold mt-2 mb-1">${processed.substring(4)}</h3>`;
                                            }
                                            
                                            // Bullet points
                                            if (processed.trim().startsWith('- ')) {
                                              return `<li class="ml-4 mb-1">${processed.substring(2)}</li>`;
                                            }
                                            
                                            // Images
                                            if (processed.includes('![](')) {
                                              const urlMatch = processed.match(/!\[\]\((.*?)\)/);
                                              if (urlMatch) {
                                                return `<img src="${urlMatch[1]}" alt="" class="max-w-full rounded my-4" />`;
                                              }
                                            }
                                            
                                            // Empty line
                                            if (processed.trim() === '') {
                                              return '<br />';
                                            }
                                            
                                            return `<p class="mb-2">${processed}</p>`;
                                          })
                                          .join('')
                                      }}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No content to preview. Start typing in the Theory Content field.</p>
                  )}
                </div>
                      </div>
                    </TabsContent>
                    </Tabs>
                  </div>

                  <div className="flex space-x-2">
                    {editingId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setMaterialForm({ 
                            title: '', 
                            category: '', 
                            description: '', 
                            readTime: '', 
                            difficulty: 'Easy', 
                            content: '', 
                            images: '' 
                          });
                          setUploadedImages([]);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        try {
                          if (!materialForm.category || !materialForm.title) {
                            toast({ 
                              title: 'Validation Error', 
                              description: 'Category and Title are required', 
                              variant: 'destructive' 
                            });
                            return;
                          }

                          let finalContent = materialForm.content || '';
                          
                          // Add uploaded images if not already in content
                          if (uploadedImages.length > 0) {
                            const imageMarkdown = uploadedImages
                              .map(url => `![](${url})`)
                              .join('\n\n');
                            if (!finalContent.includes(imageMarkdown)) {
                              finalContent = finalContent 
                                ? `${finalContent}\n\n${imageMarkdown}` 
                                : imageMarkdown;
                            }
                          }

                          if (editingId) {
                            await api.updateTheory(editingId, {
                              category: materialForm.category,
                              title: materialForm.title,
                              description: materialForm.description,
                              difficulty: materialForm.difficulty || 'Medium',
                              content: finalContent
                            });
                            toast({ title: 'Updated', description: 'Study material updated successfully.' });
                          } else {
                            await api.createTheory({
                              category: materialForm.category,
                              title: materialForm.title,
                              description: materialForm.description,
                              difficulty: materialForm.difficulty || 'Medium',
                              content: finalContent
                            });
                            toast({ title: 'Created', description: 'Study material added successfully.' });
                          }

                          // Reset form
                    setEditingId(null);
                          setMaterialForm({ 
                            title: '', 
                            category: '', 
                            description: '', 
                            readTime: '', 
                            difficulty: 'Easy', 
                            content: '', 
                            images: '' 
                          });
                    setUploadedImages([]);

                          // Refresh list
                          const res = await api.listTheory();
                          setTheoryDocs(Array.isArray(res) ? res : (res.data || []));
                  } catch (e) {
                          toast({ 
                            title: 'Error', 
                            description: e.message || 'Failed to save study material', 
                            variant: 'destructive' 
                          });
                        }
                      }}
                    >
                      {editingId ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Material
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Material
                        </>
                      )}
                    </Button>
                  </div>
              </div>
              </CardContent>
            </Card>

            {/* List of Materials */}
            <Card>
              <CardHeader>
                <CardTitle>All Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {theoryLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {theoryError && <p className="text-sm text-red-600">{theoryError}</p>}
                {!theoryLoading && !theoryError && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {theoryDocs.map(m => (
                      <div key={m._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{m.title}</p>
                              <Badge variant="outline">{m.category}</Badge>
                              <Badge 
                                variant="outline"
                                className={
                                  m.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                  m.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {m.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {m.description || 'No description'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                              setEditingId(m._id);
                              setMaterialForm({
                                title: m.title || '',
                                category: m.category || '',
                                description: m.description || '',
                                  content: m.content || '',
                                images: '',
                                readTime: '',
                                  difficulty: m.difficulty || 'Easy',
                              });
                              setUploadedImages([]);
                                // Scroll to form
                                document.querySelector('[data-form-card]')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this material?')) return;
                                try {
                                  await api.deleteTheory(m._id);
                                  toast({ title: 'Deleted', description: 'Study material deleted.' });
                                  const res = await api.listTheory();
                                  setTheoryDocs(Array.isArray(res) ? res : (res.data || []));
                                } catch (e) {
                                  toast({ 
                                    title: 'Error', 
                                    description: e.message || 'Failed to delete', 
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {theoryDocs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No study materials yet. Add your first one!
                      </p>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
          </div>
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
