# Longest Consecutive Sequence - Complete Solutions

## Problem Understanding
- Find the longest consecutive sequence (numbers that differ by exactly 1)
- Must be O(n) time complexity
- Input: Array of integers
- Output: Length of longest consecutive sequence

## 🔧 **YOUR CORRECTED CODE** (Copy this!)

```cpp
#include <bits/stdc++.h>
using namespace std;

int longestConsecutive(vector<int>& nums) {
    if(nums.empty()) return 0;
    
    unordered_set<int> s(nums.begin(), nums.end());
    int longest = 0;
    
    for(int num : s) {
        // Check if this is the start of a sequence
        if(s.find(num - 1) == s.end()) {
            int current = num;
            int length = 1;
            
            // Count the current consecutive sequence
            while(s.find(current + 1) != s.end()) {
                current++;
                length++;
            }
            
            longest = max(longest, length);
        }
    }
    
    return longest;
}

int main() {
    string line;
    
    // Read input from stdin (single line with JSON array)
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2); // Remove [ and ]
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            // Trim whitespace from item
            size_t first = item.find_first_not_of(" \t\n\r");
            if (first != string::npos) {
                size_t last = item.find_last_not_of(" \t\n\r");
                item = item.substr(first, last - first + 1);
                
                // Only parse if item is not empty
                if (!item.empty()) {
                    nums.push_back(stoi(item));
                }
            }
        }
    }
    
    // Execute solution
    int result = longestConsecutive(nums);
    
    // Print result (just the number, not an array)
    cout << result;
    
    return 0;
}
```

## Complete Solutions for All Languages

### JavaScript Solution
```javascript
// Read input from stdin
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
  // Parse input - array as JSON
  const nums = JSON.parse(input[0]);
  
  // Solution function - O(n) time
  function longestConsecutive(nums) {
    if (nums.length === 0) return 0;
    
    // Put all numbers in a set for O(1) lookup
    const numSet = new Set(nums);
    let maxLength = 0;
    
    // For each number, check if it's the start of a sequence
    for (const num of numSet) {
      // Only start counting if this is the beginning of a sequence
      // (i.e., num-1 is not in the set)
      if (!numSet.has(num - 1)) {
        let currentNum = num;
        let currentLength = 1;
        
        // Count consecutive numbers
        while (numSet.has(currentNum + 1)) {
          currentNum++;
          currentLength++;
        }
        
        maxLength = Math.max(maxLength, currentLength);
      }
    }
    
    return maxLength;
  }
  
  // Execute and print result
  const result = longestConsecutive(nums);
  console.log(result);
});
```

### Python Solution
```python
# Read input from stdin
import sys
import json

# Read input line
data = sys.stdin.read().strip()

# Parse array
nums = json.loads(data)

# Solution function - O(n) time
def longestConsecutive(nums):
    if not nums:
        return 0
    
    # Put all numbers in a set for O(1) lookup
    num_set = set(nums)
    max_length = 0
    
    # For each number, check if it's the start of a sequence
    for num in num_set:
        # Only start counting if this is the beginning of a sequence
        # (i.e., num-1 is not in the set)
        if num - 1 not in num_set:
            current_num = num
            current_length = 1
            
            # Count consecutive numbers
            while current_num + 1 in num_set:
                current_num += 1
                current_length += 1
            
            max_length = max(max_length, current_length)
    
    return max_length

# Execute and print result
result = longestConsecutive(nums)
print(result)
```

### Java Solution
```java
// Read input from stdin
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Read input line
        String line = br.readLine();
        
        // Parse array
        line = line.trim().replaceAll("[\\[\\]]", "");
        String[] numsStr = line.isEmpty() ? new String[0] : line.split(",");
        int[] nums = new int[numsStr.length];
        for (int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i].trim());
        }
        
        // Execute solution
        int result = longestConsecutive(nums);
        
        // Print result
        System.out.println(result);
    }
    
    // Solution function - O(n) time
    public static int longestConsecutive(int[] nums) {
        if (nums.length == 0) return 0;
        
        // Put all numbers in a set for O(1) lookup
        Set<Integer> numSet = new HashSet<>();
        for (int num : nums) {
            numSet.add(num);
        }
        
        int maxLength = 0;
        
        // For each number, check if it's the start of a sequence
        for (int num : numSet) {
            // Only start counting if this is the beginning of a sequence
            // (i.e., num-1 is not in the set)
            if (!numSet.contains(num - 1)) {
                int currentNum = num;
                int currentLength = 1;
                
                // Count consecutive numbers
                while (numSet.contains(currentNum + 1)) {
                    currentNum++;
                    currentLength++;
                }
                
                maxLength = Math.max(maxLength, currentLength);
            }
        }
        
        return maxLength;
    }
}
```

### C++ Solution
```cpp
// Read input from stdin
#include <iostream>
#include <vector>
#include <unordered_set>
#include <sstream>
#include <string>
#include <algorithm>
using namespace std;

// Solution function - O(n) time
int longestConsecutive(vector<int>& nums) {
    if (nums.empty()) return 0;
    
    // Put all numbers in a set for O(1) lookup
    unordered_set<int> numSet(nums.begin(), nums.end());
    int maxLength = 0;
    
    // For each number, check if it's the start of a sequence
    for (int num : numSet) {
        // Only start counting if this is the beginning of a sequence
        // (i.e., num-1 is not in the set)
        if (numSet.find(num - 1) == numSet.end()) {
            int currentNum = num;
            int currentLength = 1;
            
            // Count consecutive numbers
            while (numSet.find(currentNum + 1) != numSet.end()) {
                currentNum++;
                currentLength++;
            }
            
            maxLength = max(maxLength, currentLength);
        }
    }
    
    return maxLength;
}

int main() {
    string line;
    
    // Read input line
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2); // Remove [ and ]
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            // Trim whitespace from item
            size_t first = item.find_first_not_of(" \t\n\r");
            if (first != string::npos) {
                size_t last = item.find_last_not_of(" \t\n\r");
                item = item.substr(first, last - first + 1);
                
                // Only parse if item is not empty
                if (!item.empty()) {
                    nums.push_back(stoi(item));
                }
            }
        }
    }
    
    // Execute solution
    int result = longestConsecutive(nums);
    
    // Print result
    cout << result;
    
    return 0;
}
```

## Algorithm Explanation

### Key Insight:
1. Use a **Hash Set** for O(1) lookup
2. Only start counting from the **beginning** of a sequence
3. A number is the start if `num - 1` is NOT in the set

### Steps:
1. Put all numbers in a set
2. For each number:
   - Check if it's the start of a sequence (no `num-1` in set)
   - If yes, count how many consecutive numbers follow
   - Update max length
3. Return max length

### Time Complexity: O(n)
- Each number is visited at most twice (once as start, once in sequence)
- Set operations are O(1)

### Space Complexity: O(n)
- Set stores all numbers

## Test Cases

### Test Case 1:
- Input: `[100, 4, 200, 1, 3, 2]`
- Expected Output: `4`
- Explanation: Sequence [1,2,3,4] has length 4

### Test Case 2:
- Input: `[0,3,7,2,5,8,4,6,0,1]`
- Expected Output: `9`
- Explanation: Sequence [0,1,2,3,4,5,6,7,8] has length 9

### Test Case 3:
- Input: `[]`
- Expected Output: `0`
- Explanation: Empty array

### Test Case 4:
- Input: `[1]`
- Expected Output: `1`
- Explanation: Single element

## Input Format for Your Problem

Based on your problem setup, the input format should be:
- **Single line**: JSON array
- Example: `[100, 4, 200, 1, 3, 2]`

Make sure when creating the problem in Admin Panel, test cases use this format:
- Test Case 1 Input: `[100, 4, 200, 1, 3, 2]`
- Test Case 1 Expected Output: `4`

