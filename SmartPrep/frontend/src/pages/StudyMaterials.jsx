import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Download,
  Eye,
  Filter
} from 'lucide-react';

const StudyMaterials = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const studyMaterials = [
    {
      id: 1,
      title: 'Array Data Structure',
      category: 'DSA',
      description: 'Complete guide to arrays - one of the most fundamental data structures',
      readTime: '30 min',
      difficulty: 'Easy',
      route: '/study-materials/dsa/array'
    },
    {
      id: 2,
      title: 'String in Data Structure',
      category: 'DSA',
      description: 'Learn about string operations, pattern matching, and string algorithms',
      readTime: '35 min',
      difficulty: 'Easy',
      route: '/study-materials/dsa/string'
    },
    {
      id: 3,
      title: 'Hashing in Data Structure',
      category: 'DSA',
      description: 'Understanding hash functions, hash tables, and collision resolution techniques',
      readTime: '40 min',
      difficulty: 'Medium',
      route: '/study-materials/dsa/hashing'
    },
    {
      id: 4,
      title: 'Linked List Data Structure',
      category: 'DSA',
      description: 'Master linked lists - singly, doubly, and circular linked lists',
      readTime: '35 min',
      difficulty: 'Medium',
      route: '/study-materials/dsa/linked-list'
    },
    {
      id: 5,
      title: 'Stack Data Structure',
      category: 'DSA',
      description: 'Learn LIFO principle, stack operations, and applications',
      readTime: '30 min',
      difficulty: 'Easy',
      route: '/study-materials/dsa/stack'
    },
    {
      id: 6,
      title: 'Queue Data Structure',
      category: 'DSA',
      description: 'Understand FIFO principle, queue types, and real-world applications',
      readTime: '30 min',
      difficulty: 'Easy',
      route: '/study-materials/dsa/queue'
    },
    {
      id: 7,
      title: 'Tree Data Structure',
      category: 'DSA',
      description: 'Comprehensive guide to trees, BST, AVL trees, and tree traversals',
      readTime: '50 min',
      difficulty: 'Hard',
      route: '/study-materials/dsa/tree'
    },
    {
      id: 8,
      title: 'Graph Data Structure',
      category: 'DSA',
      description: 'Master graphs, graph algorithms, BFS, DFS, and shortest path algorithms',
      readTime: '60 min',
      difficulty: 'Hard',
      route: '/study-materials/dsa/graph'
    },
    {
      id: 9,
      title: 'Trie Data Structure',
      category: 'DSA',
      description: 'Learn prefix trees, trie operations, and applications in autocomplete',
      readTime: '40 min',
      difficulty: 'Medium',
      route: '/study-materials/dsa/trie'
    },
    {
      id: 10,
      title: 'Operating System Concepts',
      category: 'OS',
      description: 'Core concepts of operating systems including processes, threads, and memory management',
      readTime: '60 min',
      difficulty: 'Medium',
      content: `# Operating System Concepts

## What is an Operating System?
An OS is system software that manages computer hardware and software resources.

## Key Components

### 1. Process Management
- Process creation and termination
- Process scheduling
- Inter-process communication

### 2. Memory Management
- Virtual memory
- Paging and segmentation
- Memory allocation strategies

### 3. File System
- File organization
- Directory structure
- File permissions

### 4. I/O Management
- Device drivers
- Buffering and caching
- Interrupt handling`
    },
    {
      id: 11,
      title: 'Database Management Systems',
      category: 'DBMS',
      description: 'Comprehensive guide to database concepts, SQL, and normalization',
      readTime: '50 min',
      difficulty: 'Medium',
      content: `# Database Management Systems

## Introduction to DBMS
A DBMS is software that handles the storage, retrieval, and updating of data.

## Key Concepts

### 1. Relational Model
- Tables, rows, and columns
- Primary and foreign keys
- Relationships between entities

### 2. SQL Basics
- SELECT, INSERT, UPDATE, DELETE
- Joins and subqueries
- Aggregate functions

### 3. Normalization
- 1NF, 2NF, 3NF
- Reducing redundancy
- Ensuring data integrity

### 4. Transactions
- ACID properties
- Concurrency control
- Deadlock handling`
    },
    {
      id: 12,
      title: 'Quantitative Aptitude',
      category: 'Aptitude',
      description: 'Mathematical concepts and problem-solving techniques for competitive exams',
      readTime: '40 min',
      difficulty: 'Easy',
      content: `# Quantitative Aptitude

## Number Systems
- Natural, whole, integers, rational, irrational numbers
- HCF and LCM
- Number properties

## Percentages
- Basic percentage calculations
- Profit and loss
- Simple and compound interest

## Time and Work
- Work rate problems
- Pipes and cisterns
- Time and distance

## Probability
- Basic probability concepts
- Conditional probability
- Combinations and permutations`
    },
    {
      id: 13,
      title: 'Object-Oriented Programming',
      category: 'Programming',
      description: 'Core OOP concepts with examples in Java and C++',
      readTime: '55 min',
      difficulty: 'Hard',
      content: `# Object-Oriented Programming

## Four Pillars of OOP

### 1. Encapsulation
- Data hiding
- Access modifiers
- Getter and setter methods

### 2. Inheritance
- Code reusability
- IS-A relationship
- Method overriding

### 3. Polymorphism
- Method overloading
- Runtime polymorphism
- Abstract classes and interfaces

### 4. Abstraction
- Hiding implementation details
- Abstract classes
- Interfaces

## Design Patterns
- Singleton pattern
- Factory pattern
- Observer pattern`
    }
  ];

  const categories = ['All', 'DSA', 'OS', 'DBMS', 'Aptitude', 'Programming'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const filteredMaterials = studyMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Study Materials</h1>
          <p className="text-muted-foreground">
            Access comprehensive study materials for placement preparation
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search study materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {!selectedMaterial ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map(material => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <Badge className={getDifficultyColor(material.difficulty)}>
                      {material.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{material.readTime}</span>
                    </div>
                    <Badge variant="outline">{material.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {material.description}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        if (material.route) {
                          navigate(material.route);
                        } else {
                          setSelectedMaterial(material);
                        }
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Read
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedMaterial(null)}
                className="mb-4"
              >
                ← Back to Materials
              </Button>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {selectedMaterial.title}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{selectedMaterial.category}</Badge>
                    <Badge className={getDifficultyColor(selectedMaterial.difficulty)}>
                      {selectedMaterial.difficulty}
                    </Badge>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{selectedMaterial.readTime}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-foreground">
                    {selectedMaterial.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;