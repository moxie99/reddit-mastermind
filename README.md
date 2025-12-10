# Reddit Mastermind

Automate your Reddit content calendar and maximize inbound leads through strategic commenting and posting.

## Features

- ✅ **Multi-step Form Setup** - Configure company info, personas, subreddits, and keywords
- ✅ **Voice-first Personas** - Detailed backstories with tone, do's/don'ts, and CTA styles
- ✅ **Quality Content Generation** - Natural posts and threaded comments
- ✅ **Calendar Planning** - Weekly content schedules with realistic timing
- ✅ **Quality Assurance** - Anti-overposting, persona rotation, engagement metrics
- ✅ **Hot Post Intake** - Quick replies to live Reddit posts
- ✅ **Cron Job Automation** - Automatic weekly calendar generation
- ✅ **Modern UI** - Responsive design with tabs, collapsible posts, and toasts

## Getting Started

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Deployment to Vercel

### 1. Connect to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect it's a Next.js app

### 2. Set Environment Variables

Add this environment variable in your Vercel project settings:

```
CRON_SECRET=your-super-secret-key-here
```

Choose a strong, random string for the cron secret.

### 3. Deploy

Vercel will automatically deploy your app. The `vercel.json` file is already configured with:

- Cron job schedule: Every Monday at 9:00 AM
- Cron secret environment variable

### 4. Verify Cron Job

After deployment:

1. Check your Vercel dashboard → Functions → Cron Jobs
2. You should see the cron job scheduled for Mondays at 9 AM
3. The cron job will call `/api/cron/generate-week` automatically

## Usage

### Setup Your Calendar

1. **Company Info**: Add your company website, name, description, and industry
2. **ICP Segments**: Define your ideal customer profiles
3. **Personas**: Create detailed personas with voice traits and CTA styles
4. **Subreddits**: Select from 20 predefined subreddits
5. **Keywords**: Choose from 16 predefined ChatGPT queries (K1-K16)
6. **Settings**: Set posts per week

### Generate Calendar

Click "Generate Content Calendar" to create your first week's schedule.

### Hot Post Intake

For immediate replies to live Reddit posts:

1. Select persona, keyword, subreddit
2. Paste the post title and URL
3. Get a draft comment matching your persona's voice

### Cron Job Management

Use the Cron Job Manager to:

- Enable/disable automatic generation
- Set custom schedules (cron expressions)
- Manually trigger runs
- View execution history and errors

## API Endpoints

### POST `/api/cron/generate-week`

Generates a content calendar for the specified week.

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

### GET `/api/cron/generate-week`

Health check and cron job endpoint.

## Project Structure

```
├── app/
│   ├── api/cron/generate-week/route.ts  # Cron job API
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Main page
├── components/
│   ├── calendar-display.tsx             # Calendar view
│   ├── calendar-form.tsx                # Multi-step form
│   ├── cron-manager.tsx                 # Cron job manager
│   └── hot-post-intake.tsx              # Hot post replies
├── lib/
│   ├── algorithms/calendar-generator.ts # Content generation logic
│   ├── schemas/calendar-schema.ts       # Form validation
│   └── stores/                          # State management
├── vercel.json                          # Vercel config
└── CRON_SETUP.md                        # Cron setup guide
```

## Quality Features

- **Anti-overposting**: Max 2 posts per subreddit per week
- **Persona rotation**: 48-hour minimum between same persona in same subreddit
- **Natural timing**: Posts 9 AM-9 PM, comments 1-24 hours later
- **Voice consistency**: Persona traits guide content generation
- **Engagement metrics**: Track comments per post, engagement rates
- **Quality scoring**: 0-10 scale evaluating calendar quality

## Cron Job Schedule

By default, runs every Monday at 9:00 AM. You can modify the schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-week",
      "schedule": "0 9 * * 1"  // Every Monday at 9 AM
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make changes
4. Test locally
5. Submit a pull request

## License

This project is private and proprietary.
