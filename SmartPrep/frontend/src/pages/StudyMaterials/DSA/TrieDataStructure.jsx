import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrieDataStructure = () => {
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
    setContent(`# Trie Data Structure

## Introduction
A Trie (pronounced "try") or Prefix Tree is a tree-like data structure used to store strings efficiently. It allows fast prefix-based searching and string operations.

## Key Concepts

### 1. Trie Structure
- Each node represents a character
- Path from root to node represents a string
- Nodes can have up to 26 children (for lowercase English)
- End of word marker indicates complete word

### 2. Trie Properties
- Root node is empty
- Each path from root represents a prefix
- Common prefixes share same path
- Efficient for prefix matching

### 3. Trie Operations
- **Insert**: O(m) where m is string length
- **Search**: O(m) where m is string length
- **Delete**: O(m) where m is string length
- **Prefix Search**: O(m + k) where k is number of matches

## Node Structure
Each node contains:
- **Children**: Array/map of child nodes (one per character)
- **IsEndOfWord**: Boolean flag indicating word completion
- **Count**: Optional, for counting occurrences

## Advantages
- Fast prefix searching
- Space efficient for common prefixes
- Supports autocomplete efficiently
- Fast string insertion and deletion
- No hash collisions

## Disadvantages
- Memory intensive (each node has 26 pointers)
- Slower than hash table for exact lookups
- Complex implementation
- Not suitable for all string operations

## Applications

### 1. Autocomplete
- Search engines
- Text editors
- Mobile keyboards
- Command line interfaces

### 2. Spell Checker
- Word validation
- Suggestions for misspelled words
- Dictionary implementation

### 3. IP Routing
- Longest prefix matching
- Network routing tables

### 4. Phone Directory
- Contact search
- Name suggestions

### 5. String Matching
- Pattern matching
- Prefix matching
- Suffix matching

## Common Operations

### Insertion
1. Start from root
2. For each character, traverse/create child node
3. Mark last node as end of word

### Search
1. Start from root
2. Traverse path for each character
3. Check if path exists and end marker is set

### Deletion
1. Find the word
2. If word has children, just unmark end
3. If no children, delete nodes up to first branch

## Optimizations

### 1. Compressed Trie
Merge nodes with single child to save space.

### 2. Ternary Search Trie
Uses three-way branching for better space usage.

### 3. Suffix Trie
Store all suffixes for fast substring search.

## Practice Problems
1. Implement trie data structure
2. Word search in trie
3. Longest common prefix
4. Autocomplete system
5. Replace words using trie`);
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
                  Trie Data Structure
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

export default TrieDataStructure;

