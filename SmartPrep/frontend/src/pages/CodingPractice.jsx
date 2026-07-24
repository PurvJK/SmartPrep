import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import Editor from '@monaco-editor/react';
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
import apiService from '@/services/api';

const CodingPractice = () => {
  const [user, setUser] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingProblemDetails, setLoadingProblemDetails] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const { toast } = useToast();

  // Fallback hardcoded problems (used if backend fails)
  const fallbackProblems = [
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
    }
  ];

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' }
  ];

  const defaultCode = {
    javascript: `// Complete working example for Two Sum problem
// Input format: First line is array as JSON, second line is target number
// Example input: [2,7,11,15]\\n9

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let input = [];
rl.on('line', (line) => {
  input.push(line);
});

rl.on('close', () => {
  // Parse input
  const nums = JSON.parse(input[0]);
  const target = parseInt(input[1]);
  
  // Solution function
  function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      
      if (map.has(complement)) {
        return [map.get(complement), i];
      }
      
      map.set(nums[i], i);
    }
    
    return [];
  }
  
  // Execute and print result
  const result = twoSum(nums, target);
  console.log(JSON.stringify(result));
});`,
    python: `# Complete working example for Two Sum problem
# Input format: First line is array as JSON, second line is target number
# Example input: [2,7,11,15]\\n9

import sys
import json

# Read all input lines
data = sys.stdin.read().strip().split('\\n')

# Parse input
nums = json.loads(data[0])
target = int(data[1])

# Solution function
def twoSum(nums, target):
    map = {}
    
    for i in range(len(nums)):
        complement = target - nums[i]
        
        if complement in map:
            return [map[complement], i]
        
        map[nums[i]] = i
    
    return []

# Execute and print result
result = twoSum(nums, target)
print(json.dumps(result))`,
    java: `// Complete working example for Two Sum problem
// Input format: First line is array as JSON, second line is target number
// Example input: [2,7,11,15]\\n9

import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Read input
        String line1 = br.readLine();
        String line2 = br.readLine();
        
        // Parse array
        line1 = line1.trim().replaceAll("[\\\\[\\\\]]", "");
        String[] numsStr = line1.isEmpty() ? new String[0] : line1.split(",");
        int[] nums = new int[numsStr.length];
        for (int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i].trim());
        }
        
        // Parse target
        int target = Integer.parseInt(line2.trim());
        
        // Execute solution
        int[] result = twoSum(nums, target);
        
        // Print result
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(result[i]);
            if (i < result.length - 1) System.out.print(",");
        }
        System.out.println("]");
    }
    
    // Solution function
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            
            map.put(nums[i], i);
        }
        
        return new int[]{};
    }
}`,
    cpp: `// Complete working example for Two Sum problem
// Input format: First line is array as JSON, second line is target number
// Example input: [2,7,11,15]\\n9

#include <iostream>
#include <vector>
#include <unordered_map>
#include <sstream>
#include <string>
using namespace std;

// Solution function
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        
        map[nums[i]] = i;
    }
    
    return {};
}

int main() {
    string line;
    
    // Read array line
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2); // Remove [ and ]
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            nums.push_back(stoi(item));
        }
    }
    
    // Read target
    int target;
    cin >> target;
    
    // Execute solution
    vector<int> result = twoSum(nums, target);
    
    // Print result
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]";
    
    return 0;
}`
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch problems from backend
  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingProblems(true);
      try {
        const response = await apiService.getCodingProblems({ limit: 50 });
        if (response.success && response.data?.problems) {
          setProblems(response.data.problems);
        } else {
          // Fallback to hardcoded problems
          setProblems(fallbackProblems);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        // Fallback to hardcoded problems
        setProblems(fallbackProblems);
        toast({
          title: "Using offline problems",
          description: "Could not load problems from server. Using default problems.",
          variant: "default"
        });
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, [toast]);

  // Helper function to get starter code and extract user code section
  const getStarterCode = (problem, lang) => {
    if (!problem) return defaultCode[lang] || '';
    
    // Check if starterCode exists (could be Map or object)
    const starterCodeMap = problem.starterCode;
    let starterCode = '';
    
    if (starterCodeMap) {
      if (typeof starterCodeMap.get === 'function') {
        // It's a Map
        starterCode = starterCodeMap.get(lang) || '';
      } else if (typeof starterCodeMap === 'object') {
        // It's a plain object
        starterCode = starterCodeMap[lang] || '';
      }
    }
    
    // If no starter code, use default
    if (!starterCode) {
      starterCode = defaultCode[lang] || '';
    }
    
    return starterCode;
  };

  useEffect(() => {
    if (selectedProblem) {
      const starterCode = getStarterCode(selectedProblem, language);
      setCode(starterCode);
      setOutput('');
      setTestResults([]);
      setShowHints(false);
      setShowSolution(false);
    }
  }, [selectedProblem, language]);

  const selectProblem = async (problem) => {
    setLoadingProblemDetails(true);
    setOutput('');
    setTestResults([]);
    setShowHints(false);
    setShowSolution(false);
    
    // Fetch full problem details including solution
    try {
      const problemId = problem._id || problem.id;
      if (problemId) {
        const response = await apiService.getCodingProblemById(problemId);
        if (response.success && response.data) {
          // Use the full problem data with solution
          setSelectedProblem(response.data);
          const starterCode = getStarterCode(response.data, language);
          setCode(starterCode);
        } else {
          // Fallback to the problem from list
          setSelectedProblem(problem);
          const starterCode = getStarterCode(problem, language);
          setCode(starterCode);
        }
      } else {
        // Fallback problem (no ID)
        setSelectedProblem(problem);
        const starterCode = getStarterCode(problem, language);
        setCode(starterCode);
      }
    } catch (error) {
      console.error('Error fetching problem details:', error);
      // Fallback to the problem from list
      setSelectedProblem(problem);
      const starterCode = getStarterCode(problem, language);
      setCode(starterCode);
    } finally {
      setLoadingProblemDetails(false);
    }
  };

  const runCode = async () => {
    if (!selectedProblem || !code.trim()) {
      toast({
        title: "Error",
        description: "Please select a problem and write some code",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setOutput('');

    try {
      // Check if problem has an _id (from backend) or id (fallback)
      const problemId = selectedProblem._id || selectedProblem.id;
      
      if (!problemId) {
        throw new Error('Problem ID not found');
      }

      const response = await apiService.runCode(problemId, { 
        code, 
        language,
        stdin: selectedProblem.testCases?.[0]?.input || ''
      });

      if (response.success && response.data) {
        const { stdout, stderr, compile_output, message, status } = response.data;
        const executionOutput = stderr || compile_output || message || stdout || 'No output';
        setOutput(executionOutput);
        toast({
          title: "Code executed",
          description: `Status: ${status}`
        });
      } else {
        throw new Error(response.message || 'Execution failed');
      }
    } catch (error) {
      console.error('Run code error:', error);
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
      toast({
        title: "Execution failed",
        description: error.message || 'Failed to execute code',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runTests = async () => {
    if (!selectedProblem || !code.trim()) {
      toast({
        title: "Error",
        description: "Please select a problem and write some code",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Check if problem has an _id (from backend) or id (fallback)
      const problemId = selectedProblem._id || selectedProblem.id;
      
      if (!problemId) {
        throw new Error('Problem ID not found');
      }

      // Submit solution to run all test cases
      const response = await apiService.submitSolution(problemId, { code, language });

      if (response.success && response.data) {
        const { testResults: results, status } = response.data;
        
        // Format test results for display
        const formattedResults = results.map((result, index) => ({
          passed: result.passed,
          input: result.input,
          expected: result.expected,
          actual: result.actual || 'No output',
          status: result.status
        }));
        
        setTestResults(formattedResults);
        
        const passedCount = formattedResults.filter(r => r.passed).length;
        toast({
          title: "Tests completed",
          description: `${passedCount}/${formattedResults.length} test cases passed. Status: ${status}`,
          variant: passedCount === formattedResults.length ? "default" : "destructive"
        });
      } else {
        throw new Error(response.message || 'Test execution failed');
      }
    } catch (error) {
      console.error('Run tests error:', error);
      toast({
        title: "Test execution failed",
        description: error.message || 'Failed to run tests',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
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

          {loadingProblems ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading problems...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map(problem => (
                <Card key={problem._id || problem.id} className="hover:shadow-lg transition-shadow cursor-pointer"
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
                      {problem.description?.split('\n')[0] || 'No description'}
                    </p>
                    <Button className="w-full">
                      Start Solving
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-80px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Problem Description Panel */}
          <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
            <div className="h-full overflow-y-auto pr-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedProblem(null)}>
                ← Back to Problems
              </Button>
              <Badge className={getDifficultyColor(selectedProblem.difficulty)}>
                {selectedProblem.difficulty}
              </Badge>
            </div>

            {loadingProblemDetails ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading problem details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
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

                {selectedProblem.examples && selectedProblem.examples.length > 0 && (
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
                )}

                {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {selectedProblem.constraints.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

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
                  
                  {showHints && selectedProblem.hints && selectedProblem.hints.length > 0 && (
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
                    disabled={!selectedProblem.solution}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>{showSolution ? 'Hide Solution' : 'Show Solution'}</span>
                  </Button>
                  
                  {showSolution && selectedProblem.solution && (
                    <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <div className="mb-2 text-xs text-gray-400">Solution Code:</div>
                      <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                        {selectedProblem.solution}
                      </pre>
                    </div>
                  )}
                  
                  {showSolution && !selectedProblem.solution && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        No solution available for this problem yet.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

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
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle withHandle />

          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30} maxSize={80}>
            <div className="h-full flex flex-col space-y-4">
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle>Code Editor</CardTitle>
                    <div className="flex items-center gap-2">
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
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
                  {/* Info message if predefined code exists */}
                  {selectedProblem?.starterCode && (() => {
                    const starterCodeMap = selectedProblem.starterCode;
                    const hasStarterCode = typeof starterCodeMap === 'object' && 
                      (typeof starterCodeMap.get === 'function' 
                        ? starterCodeMap.get(language) 
                        : starterCodeMap[language]);
                    
                    if (hasStarterCode) {
                      // return (
                      //   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                      //     <p className="text-blue-800 dark:text-blue-200">
                      //       <strong>Predefined code template loaded.</strong> The boilerplate code with input parsing is already provided. Write your solution logic in the function marked with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">// YOUR CODE HERE</code> or modify the code as needed.
                      //     </p>
                      //   </div>
                      // );
                    }
                    return null;
                  })()}
                  
                  {/* Monaco Editor with Dark Theme */}
                  <div className="flex-1 border rounded-lg overflow-hidden bg-[#1e1e1e]">
                    <Editor
                      height="100%"
                      language={language === 'cpp' ? 'cpp' : language}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontLigatures: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        cursorStyle: 'line',
                        smoothScrolling: true,
                      }}
                    />
                  </div>
                  
                  <div className="flex space-x-2 flex-shrink-0">
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
                    <div className="flex-shrink-0">
                      <h3 className="font-semibold mb-2">Output</h3>
                      <div className="bg-[#1e1e1e] text-green-400 p-4 rounded-lg font-mono text-sm border border-gray-700">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CodingPractice;