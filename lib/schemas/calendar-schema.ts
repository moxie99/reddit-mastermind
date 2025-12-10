import { z } from 'zod';

export const icpSegmentSchema = z.object({
  segment: z.string().min(1, 'Segment name is required'),
  profile: z.string().min(1, 'Profile is required'),
  needs: z.string().min(1, 'Needs description is required'),
  whyAppeals: z.string().min(1, 'Why it appeals is required'),
});

export const personaSchema = z.object({
  username: z.string().min(1, 'Username is required').regex(/^[a-z0-9_]+$/, 'Username must be lowercase alphanumeric with underscores'),
  name: z.string().min(1, 'Name is required'),
  info: z.string().min(50, 'Persona info/backstory must be at least 50 characters'),
  tone: z.string().min(1, 'Tone is required').max(120, 'Keep tone concise').optional(),
  dos: z.string().max(400, "Keep do's concise").optional(),
  donts: z.string().max(400, "Keep don'ts concise").optional(),
  ctaStyle: z.enum(['case-study', 'invite', 'resource']).optional(),
});

export const subredditSchema = z.object({
  name: z.string().min(1, 'Subreddit name is required').regex(/^r\/\w+$/, 'Subreddit must be in format r/name'),
});

export const chatQuerySchema = z.object({
  keyword_id: z.string().min(1, 'Keyword ID is required').regex(/^K\d+$/, 'Keyword ID must be in format K1, K2, etc.'),
  keyword: z.string().min(1, 'Keyword is required'),
});

export const companyInfoSchema = z.object({
  website: z.string().url('Valid website URL is required'),
  name: z.string().min(1, 'Company name is required'),
  description: z.string().min(50, 'Company description must be at least 50 characters'),
  industry: z.string().optional(),
});

export const calendarFormSchema = z.object({
  companyInfo: companyInfoSchema,
  icpSegments: z.array(icpSegmentSchema).min(1, 'At least 1 ICP segment is required'),
  personas: z.array(personaSchema).min(2, 'At least 2 personas are required'),
  subreddits: z.array(subredditSchema).min(1, 'At least 1 subreddit is required'),
  chatQueries: z.array(chatQuerySchema).min(1, 'At least 1 query is required'),
  postsPerWeek: z.number().min(1, 'At least 1 post per week is required').max(50, 'Maximum 50 posts per week'),
});

export type CalendarFormData = z.infer<typeof calendarFormSchema>;
export type PersonaFormData = z.infer<typeof personaSchema>;
export type SubredditFormData = z.infer<typeof subredditSchema>;
export type ChatQueryFormData = z.infer<typeof chatQuerySchema>;
export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;
export type ICPSegmentFormData = z.infer<typeof icpSegmentSchema>;
