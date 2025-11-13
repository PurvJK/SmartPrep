import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QueueDataStructure = () => {
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
    setContent(`# Queue Data Structure

## Introduction
A queue is a linear data structure that follows the First In First Out (FIFO) principle. Elements are added at the rear and removed from the front.

## Key Concepts

### 1. Queue Operations
- **Enqueue**: Add element to rear - O(1)
- **Dequeue**: Remove element from front - O(1)
- **Front**: View front element without removing - O(1)
- **Rear**: View rear element - O(1)
- **IsEmpty**: Check if queue is empty - O(1)
- **Size**: Get number of elements - O(1)

### 2. Queue Implementation
- **Array-based**: Fixed or circular array
- **Linked List-based**: Dynamic size using nodes

### 3. Queue Properties
- FIFO (First In First Out) order
- Insertion at rear, deletion at front
- No random access to elements
- Sequential access only

## Types of Queues

### 1. Simple Queue
Standard queue with front and rear pointers.

### 2. Circular Queue
Rear connects back to front, efficient use of space.

### 3. Priority Queue
Elements served based on priority, not insertion order.

### 4. Double Ended Queue (Deque)
Insertion and deletion from both ends.

## Applications

### 1. Scheduling
- CPU scheduling
- Process scheduling
- Task scheduling

### 2. BFS Algorithm
- Breadth First Search in graphs
- Level-order traversal in trees

### 3. Resource Sharing
- Printer queue
- Message queue
- Request handling

### 4. Buffering
- Data streaming
- Network packet handling
- I/O operations

## Common Problems

### 1. Implement Queue
Implement queue using array and linked list.

### 2. Circular Queue
Implement circular queue to avoid space wastage.

### 3. Sliding Window Maximum
Find maximum in all subarrays of size k.

### 4. First Non-Repeating Character
Find first non-repeating character in stream.

## Advantages
- Simple implementation
- Fast operations (all O(1))
- Useful for scheduling algorithms
- Efficient for BFS traversal

## Disadvantages
- Limited access (only front and rear)
- Fixed size in array implementation
- No search operation
- Memory wastage in simple queue

## Practice Problems
1. Implement queue using array
2. Implement queue using linked list
3. Implement circular queue
4. Sliding window maximum
5. Design circular deque`);
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
                  Queue Data Structure
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

export default QueueDataStructure;

