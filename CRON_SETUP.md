# Cron Job Setup Guide

## Overview

The Reddit Mastermind includes a cron job system to automatically generate content calendars for subsequent weeks. This guide explains how to set it up.

## Features

- ✅ **Automatic Calendar Generation** - Generate calendars for future weeks automatically
- ✅ **Configurable Schedule** - Set custom cron schedules
- ✅ **Manual Trigger** - Test cron jobs manually from the UI
- ✅ **Status Tracking** - Monitor last run, next run, and execution count
- ✅ **Vercel Integration** - Works with Vercel Cron Jobs
- ✅ **External Service Support** - Can be used with any cron service

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

1. **Deploy to Vercel** - The `vercel.json` file is already configured
2. **Set Environment Variable** (Optional but recommended):
   ```
   CRON_SECRET=your-secret-key-here
   ```
3. **The cron job will automatically run** every Monday at 9 AM (as configured in `vercel.json`)

**Note:** For production, you'll need to:
- Store calendar config in a database (currently uses client-side storage)
- Update the API route to fetch config from database
- Handle authentication properly

### Option 2: External Cron Services

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

**Setup:**
1. Create a new cron job
2. Set the URL to: `https://your-domain.com/api/cron/generate-week`
3. Method: POST
4. Body (JSON):
   ```json
   {
     "config": { /* your calendar config */ },
     "weekNumber": 1
   }
   ```
5. Schedule: Set your desired schedule (e.g., every Monday at 9 AM)

### Option 3: Manual Trigger (Development/Testing)

1. Generate a calendar in the UI first
2. Open the "Cron Job Manager" panel
3. Click "Run Now" to manually trigger the cron job
4. The generated calendar will be added to your calendar list

## Cron Schedule Format

The cron schedule uses standard cron syntax:
```
minute hour day month dayOfWeek
```

**Examples:**
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 0 * * 1` - Every Monday at midnight
- `0 9 * * *` - Every day at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight

## Using the UI

1. **Enable Cron Job:**
   - Toggle the "Enable Automatic Generation" switch
   - Configure the cron schedule
   - Set how many weeks ahead to generate
   - Click "Save Configuration"

2. **Monitor Status:**
   - View last run time
   - See next scheduled run
   - Check total execution count
   - View any errors

3. **Manual Testing:**
   - Click "Run Now" to test the cron job
   - The generated calendar will appear in your calendar list

## API Endpoint

### POST `/api/cron/generate-week`

**Request Body:**
```json
{
  "config": {
    "companyInfo": { ... },
    "personas": [ ... ],
    "subreddits": [ ... ],
    "chatQueries": [ ... ],
    "postsPerWeek": 3
  },
  "weekNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "calendar": { ... },
  "weekNumber": 1,
  "generatedAt": "2025-01-15T10:00:00.000Z"
}
```

### GET `/api/cron/generate-week`

Health check endpoint. Returns service status.

## Production Considerations

For production use, consider:

1. **Database Storage:**
   - Store calendar configs in a database (PostgreSQL, MongoDB, etc.)
   - Update API route to fetch config from database
   - Store generated calendars in database

2. **Authentication:**
   - Add API key authentication
   - Use Vercel's CRON_SECRET for Vercel deployments
   - Implement proper authorization

3. **Error Handling:**
   - Set up error notifications (email, Slack, etc.)
   - Log all cron executions
   - Monitor cron job health

4. **Scalability:**
   - Consider queue system for multiple clients
   - Rate limiting
   - Resource management

## Troubleshooting

**Cron job not running:**
- Check Vercel dashboard for cron job status
- Verify `vercel.json` is properly configured
- Check API route logs

**Config not found:**
- Ensure you've generated a calendar first
- Check localStorage in browser (for client-side storage)
- In production, verify database connection

**Calendar not appearing:**
- Check browser console for errors
- Verify API response is successful
- Check calendar store is being updated

## Current Limitations

- Config is stored client-side (localStorage) - not suitable for production
- No database persistence yet
- Manual config passing required for external cron services

These will be addressed in future updates for production readiness.

