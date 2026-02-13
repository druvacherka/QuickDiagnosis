---
description: how to upload QuickDiagnosis to GitHub
---

Follow these steps to upload your project to GitHub:

1. **Initialize Git Repository**
   Open your terminal in the project root and run:
   ```powershell
   git init
   ```

2. **Stage and Commit Files**
   Add all files (except those in `.gitignore`) and create your first commit:
   ```powershell
   git add .
   git commit -m "Initial commit - QuickDiagnosis Healthcare App"
   ```

3. **Create a Repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name your repository `QuickDiagnosis`
   - Keep it Public or Private as per your preference
   - **Do NOT** initialize with README, license, or gitignore (we already have them)
   - Click "Create repository"

4. **Link and Push to GitHub**
   Copy the URL of your new repository and run:
   ```powershell
   git remote add origin YOUR_REPOSITORY_URL
   git branch -M main
   git push -u origin main
   ```

// turbo-all
5. **Verification**
   Refresh your GitHub page to see your code online.
