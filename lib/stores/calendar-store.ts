import { atom } from 'nanostores';

export interface ICPSegment {
  id: string;
  segment: string;
  profile: string;
  needs: string;
  whyAppeals: string;
}

export interface Persona {
  id: string;
  username: string;
  name: string;
  info: string; // Detailed backstory
  tone?: string; // Voice/tone guidance
  dos?: string; // Do's
  donts?: string; // Don'ts
  ctaStyle?: 'case-study' | 'invite' | 'resource';
}

export interface Subreddit {
  id: string;
  name: string;
}

export interface ChatQuery {
  keyword_id: string;
  keyword: string;
}

export interface CompanyInfo {
  website: string;
  name: string;
  description: string;
  industry?: string;
}

export interface CalendarConfig {
  companyInfo: CompanyInfo;
  icpSegments: ICPSegment[];
  personas: Persona[];
  subreddits: Subreddit[];
  chatQueries: ChatQuery[];
  postsPerWeek: number;
}

export interface RedditPost {
  post_id: string;
  subreddit: string;
  title: string;
  body: string;
  author_username: string;
  timestamp: Date;
  keyword_ids: string[];
}

export interface RedditComment {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null; // null for top-level comments
  comment_text: string;
  username: string;
  timestamp: Date;
}

export interface WeekCalendar {
  weekStart: Date;
  weekEnd: Date;
  posts: RedditPost[];
  comments: RedditComment[];
}

// Store for the configuration
export const configStore = atom<CalendarConfig | null>(null);

// Store for generated calendars
export const calendarsStore = atom<WeekCalendar[]>([]);

// Store for the current week being viewed
export const currentWeekStore = atom<number>(0);
