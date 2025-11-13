import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StringDataStructure = () => {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadContent();
  }, []);

  const loadContent = async () => {
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
  };

  const handleSave = async () => {
    console.log('Saving content:', content);
    setIsEditing(false);
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
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[600px] font-mono text-sm"
                placeholder="Write your theory content here in Markdown format..."
              />
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-foreground">
                  {content}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StringDataStructure;

