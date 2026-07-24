import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const StringDataStructure = () => {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theoryId, setTheoryId] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const TOPIC_TITLE = 'String in Data Structure';
  const TOPIC_CATEGORY = 'DSA';

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
      const response = await api.listTheory(TOPIC_CATEGORY);
      const docs = Array.isArray(response) ? response : (response.data || []);
      const theory = docs.find(doc => doc.title === TOPIC_TITLE);

      if (theory) {
        setContent(theory.content || '');
        setTheoryId(theory._id);
      } else {
        setContent(`# String in Data Structure

## Introduction
Strings are sequences of characters. They are one of the most commonly used data structures in programming.

## Key Concepts

### 1. String Representation
- Strings are typically stored as arrays of characters
- Immutable in many languages (Java, Python)
- Mutable in some languages (C, C++)

### 2. String Operations
- **Length**: O(1) or O(n) depending on implementation
- **Concatenation**: O(n + m) where n and m are string lengths
- **Substring**: O(k) where k is substring length
- **Search**: O(n) for naive, O(n+m) for KMP

### 3. Common String Operations
- **Comparison**: Lexicographic comparison
- **Reversal**: Reverse the order of characters
- **Substring extraction**: Get portion of string
- **Pattern matching**: Find pattern in string

## String Algorithms

### Pattern Matching
- **Naive Algorithm**: O(n*m) time complexity
- **KMP Algorithm**: O(n+m) time complexity
- **Rabin-Karp**: O(n+m) average case

### String Manipulation
- Palindrome checking
- Anagram detection
- String rotation
- String compression

## Common Problems

### 1. Palindrome
Check if a string reads the same forwards and backwards.

### 2. Anagram
Two strings are anagrams if they contain the same characters.

### 3. Longest Common Substring
Find the longest substring common to two strings.

### 4. String Reversal
Reverse a string in-place or create new reversed string.

## Practice Problems
1. Check if string is palindrome
2. Find longest palindrome substring
3. Group anagrams
4. Valid parentheses
5. Longest common prefix`);
        setTheoryId(null);
      }
    } catch (error) {
      console.error('Failed to load string theory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load study material',
        variant: 'destructive'
      });
      setContent('');
      setTheoryId(null);
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
      const payload = {
        category: TOPIC_CATEGORY,
        title: TOPIC_TITLE,
        description: 'Advanced coverage of string data structures and algorithms',
        difficulty: 'Medium',
        content
      };

      if (theoryId) {
        await api.updateTheory(theoryId, payload);
        toast({ title: 'Updated', description: 'Content updated successfully' });
      } else {
        const result = await api.createTheory(payload);
        setTheoryId(result._id);
        toast({ title: 'Created', description: 'Content saved successfully' });
      }

    setIsEditing(false);
    } catch (error) {
      console.error('Failed to save string theory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save content',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const highlightCode = (codeText) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    const escapeHtml = (text) => text.replace(/[&<>"']/g, m => map[m]);

    const escaped = escapeHtml(codeText);

    return escaped
      .replace(/(\/\/.*$)/gm, '<span style="color: #6b7280;">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6b7280;">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)(\1)/g, '<span style="color: #fde047;">$1$2$3</span>')
      .replace(/\b(useEffect|useState|const|let|var|function|if|else|return|import|export|from|default|async|await|try|catch|finally|for|while|do|switch|case|break|continue|new|this|class|extends|super)\b/g, '<span style="color: #22d3ee;">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #a78bfa;">$1</span>')
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (match, funcName) => {
        const keywords = ['useEffect', 'useState', 'const', 'let', 'var', 'function', 'if', 'else', 'return', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'super'];
        if (keywords.includes(funcName)) {
          return match;
        }
        return `<span style="color: #fb923c;">${funcName}</span> `;
      })
      .replace(/([{}()[\]])/g, '<span style="color: #d1d5db;">$1</span>');
  };

  const renderContent = () => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        return (
          <pre key={idx} className="bg-[#1e1e1e] dark:bg-[#0d1117] p-4 rounded-md overflow-x-auto my-4 border border-gray-700">
            <code
              className="text-sm font-mono whitespace-pre block"
              style={{ color: '#e5e7eb' }}
              dangerouslySetInnerHTML={{ __html: highlightCode(codeContent) }}
            />
          </pre>
        );
      }

      const html = part.split('\n').map(line => {
        if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-3 mb-2">${line.substring(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3 class="text-xl font-semibold mt-2 mb-1">${line.substring(4)}</h3>`;
        if (line.trim().startsWith('- ')) return `<li class="ml-4 mb-1 text-lg">${line.trim().substring(2)}</li>`;
        if (line.includes('![](')) {
          const match = line.match(/!\[\]\((.*?)\)/);
          if (match) return `<img src="${match[1]}" alt="" class="max-w-xl rounded my-4" />`;
        }
        const withInlineCode = line.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
        const withBold = withInlineCode.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const withItalic = withBold.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
        if (line.trim() === '') return '<br />';
        return `<p class="mb-2 text-lg">${withItalic}</p>`;
      }).join('');

      return (
        <div key={idx} className="whitespace-pre-wrap font-sans text-foreground text-lg" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
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
                  String in Data Structure
                </h1>
                <Badge variant="outline" className="mt-2">DSA</Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Content
                </Button>
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
              <div className="prose max-w-none">{renderContent()}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StringDataStructure;

