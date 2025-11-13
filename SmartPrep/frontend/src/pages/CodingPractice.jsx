import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CodingPractice = () => {
  const [user, setUser] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const { toast } = useToast();

  const problems = [
    {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]'
        }
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
      ],
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
        { input: '[3,3]\n6', expectedOutput: '[0,1]' }
      ],
      hints: [
        'A simple approach is to use nested loops to check all pairs.',
        'Can you solve it in O(n) time using a hash map?',
        'Store the difference (target - current number) in a hash map with its index.'
      ],
      solution: `function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}`
    },
    {
      id: 2,
      title: 'Reverse Linked List',
      difficulty: 'Easy',
      description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
      examples: [
        {
          input: 'head = [1,2,3,4,5]',
          output: '[5,4,3,2,1]'
        },
        {
          input: 'head = [1,2]',
          output: '[2,1]'
        }
      ],
      constraints: [
        'The number of nodes in the list is the range [0, 5000].',
        '-5000 <= Node.val <= 5000'
      ],
      testCases: [
        { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
        { input: '[1,2]', expectedOutput: '[2,1]' },
        { input: '[]', expectedOutput: '[]' }
      ],
      hints: [
        'Think about using three pointers: previous, current, and next.',
        'You need to reverse the direction of the pointers.',
        'Handle the edge case where the list is empty or has only one node.'
      ],
      solution: `function reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        let next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}`
    },
    {
      id: 3,
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
      examples: [
        {
          input: 's = "()"',
          output: 'true'
        },
        {
          input: 's = "()[]{}"',
          output: 'true'
        },
        {
          input: 's = "(]"',
          output: 'false'
        }
      ],
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only \'()[]{}\''
      ],
      testCases: [
        { input: '()', expectedOutput: 'true' },
        { input: '()[]{}', expectedOutput: 'true' },
        { input: '(]', expectedOutput: 'false' },
        { input: '([)]', expectedOutput: 'false' }
      ],
      hints: [
        'Use a stack data structure to keep track of opening brackets.',
        'When you encounter a closing bracket, check if it matches the most recent opening bracket.',
        'The string is valid if the stack is empty at the end.'
      ],
      solution: `function isValid(s) {
    const stack = [];
    const mapping = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    
    for (let char of s) {
        if (char in mapping) {
            if (stack.length === 0 || stack.pop() !== mapping[char]) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}`
    }
  ];

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' }
  ];

  const defaultCode = {
    javascript: '// Write your solution here\nfunction solve() {\n    \n}',
    python: '# Write your solution here\ndef solve():\n    pass',
    java: '// Write your solution here\npublic class Solution {\n    public void solve() {\n        \n    }\n}',
    cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}'
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (selectedProblem) {
      setCode(defaultCode[language]);
      setOutput('');
      setTestResults([]);
      setShowHints(false);
      setShowSolution(false);
    }
  }, [selectedProblem, language]);

  const selectProblem = (problem) => {
    setSelectedProblem(problem);
    setCode(defaultCode[language]);
    setOutput('');
    setTestResults([]);
    setShowHints(false);
    setShowSolution(false);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');

    // Simulate code execution
    setTimeout(() => {
      setOutput('Code executed successfully!\nExample output: [0, 1]');
      setIsRunning(false);
      toast({
        title: "Code executed",
        description: "Check the output below"
      });
    }, 2000);
  };

  const runTests = async () => {
    if (!selectedProblem) return;

    setIsRunning(true);
    
    // Simulate test execution
    setTimeout(() => {
      const results = selectedProblem.testCases.map((testCase, index) => ({
        passed: Math.random() > 0.3, // Random pass/fail for demo
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: index === 0 ? '[0,1]' : testCase.expectedOutput // Mock actual output
      }));
      
      setTestResults(results);
      setIsRunning(false);
      
      const passedCount = results.filter(r => r.passed).length;
      toast({
        title: "Tests completed",
        description: `${passedCount}/${results.length} test cases passed`
      });
    }, 3000);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedProblem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Coding Practice</h1>
            <p className="text-muted-foreground">
              Solve programming problems and improve your coding skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map(problem => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => selectProblem(problem)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Code className="h-8 w-8 text-primary" />
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {problem.description.split('\n')[0]}
                  </p>
                  <Button className="w-full">
                    Start Solving
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Problem Description */}
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedProblem(null)}>
                ← Back to Problems
              </Button>
              <Badge className={getDifficultyColor(selectedProblem.difficulty)}>
                {selectedProblem.difficulty}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{selectedProblem.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {selectedProblem.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Examples</h3>
                  {selectedProblem.examples.map((example, index) => (
                    <div key={index} className="bg-muted p-4 rounded-lg mb-3">
                      <p><strong>Input:</strong> {example.input}</p>
                      <p><strong>Output:</strong> {example.output}</p>
                      {example.explanation && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Explanation:</strong> {example.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {selectedProblem.constraints.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>

                {/* Hints */}
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center space-x-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>{showHints ? 'Hide Hints' : 'Show Hints'}</span>
                  </Button>
                  
                  {showHints && (
                    <div className="mt-4 space-y-2">
                      {selectedProblem.hints.map((hint, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm"><strong>Hint {index + 1}:</strong> {hint}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Solution */}
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center space-x-2"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>{showSolution ? 'Hide Solution' : 'Show Solution'}</span>
                  </Button>
                  
                  {showSolution && (
                    <div className="mt-4 bg-gray-900 p-4 rounded-lg">
                      <pre className="text-green-400 text-sm overflow-x-auto">
                        {selectedProblem.solution}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">Test Case {index + 1}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Input:</strong> {result.input}</p>
                          <p><strong>Expected:</strong> {result.expected}</p>
                          <p><strong>Actual:</strong> {result.actual}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Code Editor */}
          <div className="space-y-4">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Code Editor</CardTitle>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your code here..."
                  className="flex-1 font-mono text-sm min-h-[300px] resize-none"
                />
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={runCode} 
                    disabled={isRunning}
                    className="flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </Button>
                  
                  <Button 
                    onClick={runTests} 
                    disabled={isRunning}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
                  </Button>
                </div>

               

                {/* Output */}
                {output && (
                  <div>
                    <h3 className="font-semibold mb-2">Output</h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                      <pre>{output}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;