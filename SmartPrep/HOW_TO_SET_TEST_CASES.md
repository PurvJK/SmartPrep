# How to Set Test Cases for Longest Consecutive Sequence

## Step-by-Step Guide

### 1. Access Admin Panel
- Go to `/admin` or `/admin/coding` in your application
- Make sure you're logged in as an admin user

### 2. Navigate to Coding Problems Tab
- Click on the **"Coding Problems"** tab in the Admin Panel

### 3. Fill in Problem Details
- **Title**: `Longest Consecutive Sequence`
- **Description**: Copy the problem description
- **Category**: Select `Arrays` (or appropriate category)
- **Difficulty**: Select `Medium` (or appropriate difficulty)

### 4. Add Test Cases

Click the **"Add Test Case"** button to add each test case.

#### Test Case 1:
- **Input**: `[100, 4, 200, 1, 3, 2]`
- **Expected Output**: `4`

#### Test Case 2:
- **Input**: `[0,3,7,2,5,8,4,6,0,1]`
- **Expected Output**: `9`

#### Test Case 3 (Edge Case - Empty Array):
- **Input**: `[]`
- **Expected Output**: `0`

#### Test Case 4 (Edge Case - Single Element):
- **Input**: `[1]`
- **Expected Output**: `1`

#### Test Case 5 (Edge Case - No Consecutive):
- **Input**: `[100, 200, 300]`
- **Expected Output**: `1`

#### Test Case 6 (Edge Case - All Consecutive):
- **Input**: `[1, 2, 3, 4, 5]`
- **Expected Output**: `5`

#### Test Case 7 (Edge Case - Negative Numbers):
- **Input**: `[-1, 0, 1, 2]`
- **Expected Output**: `4`

#### Test Case 8 (Edge Case - Duplicates):
- **Input**: `[1, 2, 0, 1]`
- **Expected Output**: `3`

## Important Format Rules

### ✅ Correct Input Format:
- Use JSON array format: `[100, 4, 200, 1, 3, 2]`
- Single line, no line breaks
- No spaces after commas (optional, but cleaner): `[100,4,200,1,3,2]` also works
- Can include negative numbers: `[-1, 0, 1, 2]`

### ✅ Correct Output Format:
- Just the number: `4`
- No brackets, no quotes, no extra text
- Just the integer result

### ❌ Wrong Formats:
- Input: `100, 4, 200` (missing brackets)
- Input: `[100\n4\n200]` (line breaks)
- Output: `[4]` (should be just `4`)
- Output: `The answer is 4` (should be just `4`)

## Visual Guide

When you're in the Admin Panel, you'll see:

```
Test Cases *
[Add Test Case] button

┌─────────────────────────────────────┐
│ Test Case 1                    [X] │
│ ┌───────────────────────────────┐   │
│ │ Input                        │   │
│ │ [100, 4, 200, 1, 3, 2]      │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ Expected Output              │   │
│ │ 4                            │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Test Case 2                    [X] │
│ ┌───────────────────────────────┐   │
│ │ Input                        │   │
│ │ [0,3,7,2,5,8,4,6,0,1]        │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ Expected Output              │   │
│ │ 9                            │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Quick Copy-Paste Test Cases

### For Quick Setup, Copy These:

**Test Case 1:**
```
Input: [100, 4, 200, 1, 3, 2]
Expected Output: 4
```

**Test Case 2:**
```
Input: [0,3,7,2,5,8,4,6,0,1]
Expected Output: 9
```

**Test Case 3:**
```
Input: []
Expected Output: 0
```

**Test Case 4:**
```
Input: [1]
Expected Output: 1
```

**Test Case 5:**
```
Input: [100, 200, 300]
Expected Output: 1
```

**Test Case 6:**
```
Input: [1, 2, 3, 4, 5]
Expected Output: 5
```

**Test Case 7:**
```
Input: [-1, 0, 1, 2]
Expected Output: 4
```

**Test Case 8:**
```
Input: [1, 2, 0, 1]
Expected Output: 3
```

## After Adding Test Cases

1. Fill in other fields (Examples, Constraints, Hints, Solution) if needed
2. Click **"Save"** or **"Create"** button
3. The problem will be saved with all test cases
4. Students can now solve the problem and their code will be tested against all these cases

## Testing Your Test Cases

After creating the problem:
1. Go to the Coding Practice page
2. Select "Longest Consecutive Sequence"
3. Write your solution
4. Click "Run Tests"
5. You should see all test cases pass if your solution is correct

## Troubleshooting

### Problem: Test cases not passing
- **Check input format**: Must be JSON array `[1, 2, 3]`
- **Check output format**: Must be just the number `4`, not `[4]` or `"4"`
- **Check for extra spaces**: The code trims whitespace, but keep it clean

### Problem: Can't add test cases
- Make sure you're in the "Coding Problems" tab
- Click "Add Test Case" button
- At least one test case is required

### Problem: Test case deleted
- You can remove test cases by clicking the [X] button
- You must have at least 1 test case to save the problem

