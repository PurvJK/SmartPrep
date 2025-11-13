import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GraphDataStructure = () => {
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
    setContent(`# Graph Data Structure

## Introduction
A graph is a non-linear data structure consisting of vertices (nodes) and edges connecting them. Graphs model relationships between objects.

## Key Concepts

### 1. Graph Terminology
- **Vertex/Node**: Element in graph
- **Edge**: Connection between vertices
- **Path**: Sequence of vertices connected by edges
- **Cycle**: Path that starts and ends at same vertex
- **Degree**: Number of edges connected to vertex
- **Weighted Graph**: Edges have weights/costs
- **Directed Graph**: Edges have direction
- **Undirected Graph**: Edges have no direction

### 2. Graph Representation
- **Adjacency Matrix**: 2D array, O(V²) space
- **Adjacency List**: Array of lists, O(V+E) space
- **Edge List**: List of edges, O(E) space

## Types of Graphs

### 1. Directed Graph (Digraph)
Edges have direction, represented as (u, v).

### 2. Undirected Graph
Edges have no direction, represented as {u, v}.

### 3. Weighted Graph
Edges have weights representing cost/distance.

### 4. Connected Graph
Path exists between every pair of vertices.

### 5. Complete Graph
Every vertex connected to every other vertex.

## Graph Traversals

### 1. Depth First Search (DFS)
- Uses stack (recursion)
- Explores as far as possible before backtracking
- Time: O(V + E)
- Applications: Topological sort, cycle detection

### 2. Breadth First Search (BFS)
- Uses queue
- Explores level by level
- Time: O(V + E)
- Applications: Shortest path (unweighted), level-order

## Graph Algorithms

### 1. Shortest Path
- **Dijkstra's**: Single source, non-negative weights
- **Bellman-Ford**: Single source, handles negative weights
- **Floyd-Warshall**: All pairs shortest path

### 2. Minimum Spanning Tree (MST)
- **Kruskal's**: Greedy, uses union-find
- **Prim's**: Greedy, uses priority queue

### 3. Topological Sort
Ordering of vertices in directed acyclic graph (DAG).

### 4. Cycle Detection
Detect cycles in directed and undirected graphs.

## Applications
- Social networks
- Web page linking
- GPS navigation
- Network routing
- Dependency resolution
- Recommendation systems

## Advantages
- Flexible representation
- Models real-world relationships
- Powerful for complex problems
- Many efficient algorithms

## Disadvantages
- Can be memory intensive
- Some algorithms are complex
- Graph problems often NP-hard

## Practice Problems
1. Implement graph using adjacency list
2. BFS and DFS traversal
3. Detect cycle in graph
4. Shortest path algorithms
5. Minimum spanning tree`);
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
                  Graph Data Structure
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

export default GraphDataStructure;

