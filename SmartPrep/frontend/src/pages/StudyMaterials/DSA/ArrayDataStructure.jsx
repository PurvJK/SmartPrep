import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const TOPIC_TITLE = 'Array Data Structure';
const TOPIC_CATEGORY = 'DSA';

const ArrayDataStructure = () => {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theoryId, setTheoryId] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend by title and category
      const theories = await api.listTheory(TOPIC_CATEGORY);
      const theory = Array.isArray(theories) 
        ? theories.find(t => t.title === TOPIC_TITLE && t.category === TOPIC_CATEGORY)
        : null;
      
      if (theory) {
        setContent(theory.content || '');
        setTheoryId(theory._id);
      } else {
        // Set default content if not found
        setContent(`# Array Data Structure

## Introduction
Arrays are one of the most fundamental data structures in computer science. They store elements of the same type in contiguous memory locations.

## Key Concepts

### 1. Array Declaration
- Arrays can be declared with a fixed size
- Elements are accessed using indices (0-based indexing)
- Memory allocation is contiguous

### 2. Array Operations
- **Access**: O(1) - Direct access by index
- **Search**: O(n) - Linear search through elements
- **Insertion**: O(n) - May require shifting elements
- **Deletion**: O(n) - May require shifting elements

### 3. Types of Arrays
- **One-dimensional arrays**: Simple list of elements
- **Multi-dimensional arrays**: Arrays of arrays (2D, 3D, etc.)
- **Dynamic arrays**: Size can change at runtime

## Common Operations

### Traversal
\`\`\`javascript
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
\`\`\`

### Searching
- Linear Search: O(n)
- Binary Search: O(log n) - requires sorted array

### Sorting
- Bubble Sort: O(n²)
- Quick Sort: O(n log n) average case
- Merge Sort: O(n log n)

## Advantages
- Fast access by index
- Simple to use
- Memory efficient for fixed-size data

## Disadvantages
- Fixed size (in most languages)
- Insertion/deletion can be expensive
- Wasted space if array is not fully utilized

## Practice Problems
1. Find maximum element in array
2. Reverse an array
3. Find second largest element
4. Array rotation
5. Two sum problem`);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can edit content',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      if (theoryId) {
        // Update existing
        await api.updateTheory(theoryId, {
          category: TOPIC_CATEGORY,
          title: TOPIC_TITLE,
          description: 'Complete guide to arrays - one of the most fundamental data structures',
          difficulty: 'Easy',
          content: content
        });
        toast({ title: 'Updated', description: 'Content updated successfully' });
      } else {
        // Create new
        const result = await api.createTheory({
          category: TOPIC_CATEGORY,
          title: TOPIC_TITLE,
          description: 'Complete guide to arrays - one of the most fundamental data structures',
          difficulty: 'Easy',
          content: content
        });
        setTheoryId(result._id);
        toast({ title: 'Created', description: 'Content saved successfully' });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save content',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/study-materials')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Study Materials
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Array Data Structure
                </h1>
                <Badge variant="outline" className="mt-2">DSA</Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              {user?.role === 'admin' && (
                isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Content
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[600px] font-mono text-sm"
                placeholder="Write your theory content here in Markdown format..."
              />
            ) : (
              <div className="prose max-w-none">
                {(() => {
                  // Split content by code blocks
                  const parts = content.split(/(```[\s\S]*?```)/g);
                  return parts.map((part, idx) => {
                    // Check if this is a code block
                    if (part.startsWith('```') && part.endsWith('```')) {
                      const codeContent = part.slice(3, -3).trim();
                      const lines = codeContent.split('\n');
                      const language = lines[0] || '';
                      const code = lines.slice(1).join('\n') || lines[0];
                      
                      // Basic syntax highlighting
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
                        className="whitespace-pre-wrap font-sans text-foreground"
                        dangerouslySetInnerHTML={{ 
                          __html: part.split('\n').map(line => {
                            // Basic markdown rendering
                            if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
                            if (line.startsWith('## ')) return `<h2 class="text-xl font-bold mt-3 mb-2">${line.substring(3)}</h2>`;
                            if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold mt-2 mb-1">${line.substring(4)}</h3>`;
                            if (line.startsWith('- ')) return `<li class="ml-4 mb-1">${line.substring(2)}</li>`;
                            if (line.startsWith('![](')) {
                              const url = line.match(/!\[\]\((.*?)\)/)?.[1];
                              return url ? `<img src="${url}" alt="" class="max-w-full rounded my-4" />` : line;
                            }
                            // Inline code
                            const withInlineCode = line.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
                            // Bold
                            const withBold = withInlineCode.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            // Italic
                            const withItalic = withBold.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
                            if (line.trim() === '') return '<br />';
                            return `<p class="mb-2">${withItalic}</p>`;
                          }).join('')
                        }}
                      />
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArrayDataStructure;

