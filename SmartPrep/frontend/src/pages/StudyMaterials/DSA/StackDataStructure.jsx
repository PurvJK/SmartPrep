import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StackDataStructure = () => {
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
    setContent(`# Stack Data Structure

## Introduction
A stack is a linear data structure that follows the Last In First Out (LIFO) principle. Elements are added and removed from the same end called the "top".

## Key Concepts

### 1. Stack Operations
- **Push**: Add element to top - O(1)
- **Pop**: Remove element from top - O(1)
- **Peek/Top**: View top element without removing - O(1)
- **IsEmpty**: Check if stack is empty - O(1)
- **Size**: Get number of elements - O(1)

### 2. Stack Implementation
- **Array-based**: Fixed or dynamic size array
- **Linked List-based**: Dynamic size using nodes

### 3. Stack Properties
- LIFO (Last In First Out) order
- All operations at one end (top)
- No random access to elements
- Limited to sequential access

## Applications

### 1. Expression Evaluation
- Infix to Postfix conversion
- Postfix expression evaluation
- Prefix expression evaluation

### 2. Function Calls
- Call stack in programming languages
- Recursion implementation
- Undo/Redo operations

### 3. Backtracking Algorithms
- DFS (Depth First Search)
- Maze solving
- N-Queens problem

### 4. Parentheses Matching
- Valid parentheses checking
- Balanced brackets problem

## Common Problems

### 1. Valid Parentheses
Check if parentheses in expression are balanced.

### 2. Next Greater Element
Find next greater element for each element in array.

### 3. Stock Span Problem
Calculate span of stock prices.

### 4. Largest Rectangle in Histogram
Find largest rectangular area in histogram.

## Advantages
- Simple implementation
- Fast operations (all O(1))
- Memory efficient
- Useful for many algorithms

## Disadvantages
- Limited access (only top element)
- Fixed size in array implementation
- No search operation

## Practice Problems
1. Implement stack using array
2. Implement stack using linked list
3. Valid parentheses
4. Next greater element
5. Largest rectangle in histogram`);
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
                  Stack Data Structure
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

export default StackDataStructure;

