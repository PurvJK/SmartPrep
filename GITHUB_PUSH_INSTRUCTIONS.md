# Instructions to Push to GitHub

## Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Enter repository name (e.g., "SmartPrep")
3. Choose Public or Private
4. **DO NOT** check "Initialize with README"
5. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, run these commands in your terminal:

```bash
# Add your GitHub repository as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: If you already have a repository URL

If you already created the repository, just run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## What's been done:
✅ Git repository initialized
✅ .gitignore file created (excludes node_modules, .env, etc.)
✅ All files committed
✅ Ready to push to GitHub

## Important Notes:
- Make sure you have a `.env` file in `SmartPrep/backend/` with your environment variables
- The `.env` file is already in `.gitignore` so it won't be pushed
- `node_modules` folders are excluded from the repository
- Upload images in `uploads/` folder are included (you may want to add them to .gitignore if they're large)










