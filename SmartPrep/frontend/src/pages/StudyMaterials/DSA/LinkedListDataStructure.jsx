import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LinkedListDataStructure = () => {
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
    setContent(`# Linked List Data Structure

## Introduction
A linked list is a linear data structure where elements are stored in nodes, and each node points to the next node in the sequence.

## Key Concepts

### 1. Node Structure
Each node contains:
- **Data**: The value stored in the node
- **Next**: Pointer/reference to the next node

### 2. Types of Linked Lists
- **Singly Linked List**: Each node points to next node only
- **Doubly Linked List**: Each node points to both next and previous
- **Circular Linked List**: Last node points back to first node

### 3. Linked List Operations
- **Insertion**: O(1) at beginning, O(n) at end
- **Deletion**: O(1) at beginning, O(n) at end
- **Search**: O(n) - must traverse from head
- **Access**: O(n) - no random access

## Advantages
- Dynamic size - can grow/shrink at runtime
- Efficient insertion/deletion at beginning
- No memory waste (only allocates what's needed)
- Easy to implement stacks and queues

## Disadvantages
- No random access - must traverse from head
- Extra memory for pointers
- Cache performance is poor (non-contiguous memory)
- Reverse traversal difficult in singly linked list

## Common Operations

### Insertion
- At beginning: Create new node, point to current head
- At end: Traverse to end, point last node to new node
- At position: Traverse to position, update pointers

### Deletion
- At beginning: Update head pointer
- At end: Traverse to second last, update pointer
- At position: Traverse to position, update pointers

## Applications
- Implementation of stacks and queues
- Dynamic memory allocation
- Polynomial representation
- Image viewer (next/previous navigation)
- Music player (playlist navigation)

## Practice Problems
1. Reverse a linked list
2. Detect cycle in linked list
3. Merge two sorted linked lists
4. Find middle of linked list
5. Remove duplicates from sorted list`);
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
                  Linked List Data Structure
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

export default LinkedListDataStructure;

