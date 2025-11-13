import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TreeDataStructure = () => {
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
    setContent(`# Tree Data Structure

## Introduction
A tree is a hierarchical data structure consisting of nodes connected by edges. Each tree has a root node and child nodes.

## Key Concepts

### 1. Tree Terminology
- **Root**: Topmost node with no parent
- **Node**: Element containing data and references
- **Edge**: Connection between nodes
- **Leaf**: Node with no children
- **Internal Node**: Node with at least one child
- **Height**: Longest path from root to leaf
- **Depth**: Distance from root to node
- **Level**: Set of nodes at same depth

### 2. Tree Properties
- Hierarchical structure
- One root node
- Each node has exactly one parent (except root)
- No cycles
- N nodes have N-1 edges

## Types of Trees

### 1. Binary Tree
Each node has at most 2 children (left and right).

### 2. Binary Search Tree (BST)
Binary tree with ordering property:
- Left subtree < Root < Right subtree

### 3. AVL Tree
Self-balancing BST with height difference ≤ 1.

### 4. Heap
Complete binary tree with heap property:
- Max Heap: Parent ≥ Children
- Min Heap: Parent ≤ Children

### 5. Trie (Prefix Tree)
Tree for storing strings with common prefixes.

## Tree Traversals

### 1. Inorder (Left-Root-Right)
Used for BST to get sorted order.

### 2. Preorder (Root-Left-Right)
Used for copying tree structure.

### 3. Postorder (Left-Right-Root)
Used for deleting tree.

### 4. Level Order
Visit nodes level by level (BFS).

## Operations

### Search
- BST: O(log n) average, O(n) worst
- General tree: O(n)

### Insertion
- BST: O(log n) average, O(n) worst
- General tree: O(1) at specific position

### Deletion
- BST: O(log n) average, O(n) worst
- General tree: O(n) to find node

## Applications
- File system hierarchy
- Database indexing
- Expression evaluation
- Decision trees
- XML/HTML parsing
- Priority queues (heap)

## Practice Problems
1. Implement binary tree
2. Implement BST operations
3. Tree traversals (inorder, preorder, postorder)
4. Maximum depth of binary tree
5. Validate BST`);
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
                  Tree Data Structure
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

export default TreeDataStructure;

