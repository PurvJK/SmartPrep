# Predefined Code Feature Guide

## Overview
Admins can now add predefined code templates (boilerplate) for coding problems. This allows users to focus on writing the solution logic instead of dealing with input parsing.

## How It Works

### For Admins

1. **Go to Admin Panel** → **Coding Problems** tab
2. **Add/Edit a Problem**
3. **Scroll to "Predefined Code (Optional)" section**
4. **Add boilerplate code for each language** (JavaScript, Python, Java, C++)

### Example Predefined Code for C++

```cpp
#include <bits/stdc++.h>
using namespace std;

// YOUR CODE HERE
int solution(vector<int>& nums) {
    // Write your logic here
    return 0;
}

int main() {
    string line;
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2);
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            size_t first = item.find_first_not_of(" \t\n\r");
            if (first != string::npos) {
                size_t last = item.find_last_not_of(" \t\n\r");
                item = item.substr(first, last - first + 1);
                if (!item.empty()) {
                    nums.push_back(stoi(item));
                }
            }
        }
    }
    
    int result = solution(nums);
    cout << result;
    
    return 0;
}
```

### Key Points

- **Placeholder**: Use `// YOUR CODE HERE` (or `# YOUR CODE HERE` for Python) to mark where users should write their solution
- **Full Control**: Users can see and edit the entire template
- **Language-Specific**: Each language (JavaScript, Python, Java, C++) has its own predefined code field
- **Optional**: If no predefined code is provided, the default template is used

## For Users

1. **Select a problem** in Coding Practice
2. **If predefined code exists**, you'll see:
   - A blue info banner explaining the template
   - The full boilerplate code in the editor
   - A placeholder `// YOUR CODE HERE` showing where to write your solution
3. **Write your solution logic** in the marked area or modify the code as needed
4. **Run/Test** your code as usual

## Benefits

✅ **Focus on Logic**: Users don't need to write input parsing code  
✅ **Consistent Format**: All solutions follow the same structure  
✅ **Less Errors**: Reduces syntax errors in boilerplate code  
✅ **Faster Coding**: Users can start solving immediately  

## Example Use Cases

### Longest Consecutive Sequence Problem

**Predefined Code (C++):**
```cpp
#include <bits/stdc++.h>
using namespace std;

// YOUR CODE HERE
int longestConsecutive(vector<int>& nums) {
    if(nums.empty()) return 0;
    
    unordered_set<int> s(nums.begin(), nums.end());
    int longest = 0;
    
    for(int num : s) {
        if(s.find(num - 1) == s.end()) {
            int current = num;
            int length = 1;
            
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
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2);
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            size_t first = item.find_first_not_of(" \t\n\r");
            if (first != string::npos) {
                size_t last = item.find_last_not_of(" \t\n\r");
                item = item.substr(first, last - first + 1);
                if (!item.empty()) {
                    nums.push_back(stoi(item));
                }
            }
        }
    }
    
    int result = longestConsecutive(nums);
    cout << result;
    
    return 0;
}
```

**User's Task**: The solution function is already provided! Users just need to understand it or modify it.

## Technical Details

- **Storage**: `starterCode` field in `CodingProblem` model (Mongoose Map)
- **Format**: Object with language keys: `{ javascript: '', python: '', java: '', cpp: '' }`
- **Fallback**: If no predefined code, uses default templates
- **Editor**: Monaco Editor with dark theme displays the code

## Tips for Admins

1. **Always include input parsing** in the predefined code
2. **Use clear placeholders** like `// YOUR CODE HERE`
3. **Test the template** before publishing the problem
4. **Provide complete working examples** when possible
5. **Keep it simple** - don't overcomplicate the boilerplate





