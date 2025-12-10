# Vercel Deployment Guide

## Quick Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 3. Set Environment Variable
In Vercel dashboard → Project Settings → Environment Variables:

```
CRON_SECRET=your-super-secret-key-here
```

Use a strong, random string (you can generate one with `openssl rand -base64 32`)

### 4. Deploy
Click "Deploy" - Vercel will build and deploy automatically

### 5. Verify Cron Job
After deployment:
1. Go to Vercel Dashboard → Your Project → Functions → Cron Jobs
2. You should see: `/api/cron/generate-week` scheduled for `0 9 * * 1`
3. The cron job will run every Monday at 9 AM UTC

## Testing the Cron Job

### Manual Test
You can test the cron endpoint manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/cron/generate-week
```

### Check Logs
In Vercel Dashboard → Functions → Logs, you can see cron job executions

## Production Notes

For production use, you'll want to:

1. **Add Database**: Store calendar configs and generated calendars
2. **Update Cron Handler**: Modify `/api/cron/generate-week` to fetch from/store to database
3. **Add Notifications**: Email/Slack alerts for cron job failures
4. **Monitor Usage**: Track API calls and performance

## Cron Schedule

Current schedule: `0 9 * * 1` (Every Monday at 9:00 AM UTC)

To change the schedule, edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-week",
      "schedule": "0 9 * * 1"  // Change this cron expression
    }
  ]
}
```

## Troubleshooting

### Cron Job Not Running
- Check Vercel Dashboard → Functions → Cron Jobs
- Verify `CRON_SECRET` environment variable is set
- Check function logs for errors

### Build Errors
- Make sure all dependencies are in `package.json`
- Check that `vercel.json` is valid JSON
- Verify Next.js version compatibility

### API Errors
- Check Vercel function logs
- Verify environment variables are set correctly
- Test API endpoints locally first

## Cost Considerations

Vercel Cron Jobs are included in Hobby plan (free) for basic usage. For higher frequency schedules, you may need Pro plan.
