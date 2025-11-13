import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HashingDataStructure = () => {
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
    setContent(`# Hashing in Data Structure

## Introduction
Hashing is a technique used to map data of arbitrary size to fixed-size values. Hash tables provide fast data access.

## Key Concepts

### 1. Hash Function
A function that converts a key into an index in the hash table.
- Should be deterministic
- Should distribute keys uniformly
- Should be fast to compute

### 2. Hash Table
A data structure that implements an associative array using hash functions.
- Average time complexity: O(1) for search, insert, delete
- Worst case: O(n) if all keys hash to same index

### 3. Hash Function Properties
- **Deterministic**: Same input always produces same output
- **Uniform distribution**: Keys should be evenly distributed
- **Fast computation**: Should be O(1) time complexity

## Collision Resolution

### 1. Chaining
Each bucket contains a linked list of entries.
- Simple to implement
- Handles any number of collisions
- Requires extra memory for pointers

### 2. Open Addressing
All entries are stored in the hash table itself.
- **Linear Probing**: Check next slot sequentially
- **Quadratic Probing**: Check slots at quadratic intervals
- **Double Hashing**: Use second hash function

## Common Hash Functions

### Division Method
\`hash(key) = key % table_size\`

### Multiplication Method
\`hash(key) = floor(table_size * ((key * A) mod 1))\`

### Universal Hashing
Uses a family of hash functions to avoid worst-case scenarios.

## Applications
- Database indexing
- Caching (LRU cache)
- Symbol tables in compilers
- Associative arrays
- Sets implementation

## Advantages
- Fast average-case performance
- Flexible key types
- Efficient for large datasets

## Disadvantages
- Collision handling overhead
- Not suitable for range queries
- Hash function design is critical

## Practice Problems
1. Implement hash table with chaining
2. Two sum problem using hash map
3. Group anagrams using hash map
4. Longest consecutive sequence
5. Design LRU cache`);
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
                  Hashing in Data Structure
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

export default HashingDataStructure;

