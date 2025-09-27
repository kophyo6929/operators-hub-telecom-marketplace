# Deploy to Vercel - Quick Guide

## Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Push your project code to the repository:
```bash
git init
git add .
git commit -m "Initial commit - Operators Hub"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Vite project

## Step 3: Configure Environment Variables
In your Vercel project dashboard, go to Settings → Environment Variables and add:

```
VITE_SUPABASE_URL = https://whlpotilwtzcvmeikmvj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID = whlpotilwtzcvmeikmvj
```

## Step 4: Deploy
- Vercel will automatically build and deploy your project
- Any future commits to main branch will trigger automatic deployments
- Your app will be available at: `https://your-project-name.vercel.app`

## Notes
- The `vercel.json` file is already configured for optimal deployment
- Build command: `npm run build`
- Install command: `npm install --legacy-peer-deps` (to handle date-fns conflict)
- Output directory: `dist`

## Free Tier Limits
- Vercel free tier includes:
  - 100GB bandwidth per month
  - Unlimited personal projects
  - Automatic HTTPS
  - Global CDN
  - Perfect for this telecom marketplace project!