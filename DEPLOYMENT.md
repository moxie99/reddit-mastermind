# Render Deployment Guide

## Overview

Render is a great alternative to Vercel for deploying Next.js applications. Unlike Vercel, Render doesn't have built-in cron jobs, so we'll use external cron services for automated calendar generation.

## Quick Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Click "New +" → "Web Service"

### 3. Deploy Your App
1. Select your GitHub repository
2. Configure build settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Set environment variables (see below)

### 4. Set Environment Variables
In Render Dashboard → Your Service → Environment:

```
CRON_SECRET=your-super-secret-key-here
NODE_ENV=production
```

Use a strong, random string for CRON_SECRET (generate with `openssl rand -base64 32`)

### 5. Deploy
Click "Create Web Service" - Render will build and deploy automatically

## Setting Up Cron Jobs

Since Render doesn't have built-in cron jobs, use one of these external services:

### Option 1: Cron-job.org (Free & Recommended)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - **Title**: Reddit Mastermind Weekly Calendar
   - **URL**: `https://your-app.onrender.com/api/cron/generate-week`
   - **Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule**: Weekly → Monday → 9:00 AM

### Option 2: EasyCron (Free Tier Available)

1. Go to [easycron.com](https://www.easycron.com)
2. Create account (free tier available)
3. Create cron job:
   - **URL**: `https://your-app.onrender.com/api/cron/generate-week`
   - **Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule**: Every week, Monday at 9:00 AM

### Option 3: GitHub Actions (Advanced)

If you prefer to keep everything in GitHub, you can use GitHub Actions:

Create `.github/workflows/cron.yml`:
```yaml
name: Weekly Calendar Generation

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  generate-calendar:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger calendar generation
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.onrender.com/api/cron/generate-week
```

Add `CRON_SECRET` to GitHub Secrets.

## Testing the Cron Job

### Manual Test
Test the cron endpoint manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.onrender.com/api/cron/generate-week
```

### Check Render Logs
In Render Dashboard → Your Service → Logs, you can see cron job executions

## Production Notes

For production use, you'll want to:

1. **Add Database**: Store calendar configs and generated calendars (Render offers PostgreSQL)
2. **Update Cron Handler**: Modify `/api/cron/generate-week` to fetch from/store to database
3. **Add Notifications**: Email/Slack alerts for cron job failures
4. **Monitor Usage**: Track API calls and performance

## Troubleshooting

### Cron Job Not Running
- Check your external cron service dashboard
- Verify `CRON_SECRET` environment variable is set
- Check Render service logs for errors
- Test the endpoint manually first

### Build Errors
- Make sure all dependencies are in `package.json`
- Check Render build logs for specific errors
- Verify Next.js version compatibility
- Render supports Node.js 14+

### API Errors
- Check Render service logs
- Verify environment variables are set correctly
- Test API endpoints locally first
- Make sure the app is not in sleep mode (Render free tier sleeps after inactivity)

### App Sleeping (Free Tier)
Render's free tier sleeps after 15 minutes of inactivity. Paid plans don't sleep.

## Cost Considerations

### Render Pricing
- **Free Tier**: 750 hours/month, sleeps after 15 min inactivity
- **Starter**: $7/month (always on, more resources)
- **Standard**: $25+/month (higher performance)

### Cron Service Pricing
- **Cron-job.org**: Free for basic usage
- **EasyCron**: Free tier available
- **GitHub Actions**: Included with GitHub (free for public repos)

## Cron Service Comparison

| Service | Free Tier | Setup Difficulty | Reliability |
|---------|-----------|------------------|-------------|
| Cron-job.org | ✅ Yes | Easy | Good |
| EasyCron | ✅ Yes | Easy | Good |
| GitHub Actions | ✅ Yes | Medium | Excellent |
| Zapier | ❌ No | Easy | Good |
| Make.com | ❌ No | Easy | Good |

## Alternative: Vercel Deployment

If you prefer built-in cron jobs, you can also deploy on Vercel:

1. Vercel has built-in cron jobs (no external services needed)
2. Follow the Vercel deployment guide in the original README
3. Cron jobs are included in the free Hobby plan

The choice between Render + external cron vs Vercel depends on your preference for:
- **Render**: More control, external services
- **Vercel**: Simpler setup, built-in cron jobs
