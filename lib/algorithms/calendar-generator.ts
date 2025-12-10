import type { CalendarConfig, RedditPost, RedditComment, WeekCalendar } from '@/lib/stores/calendar-store';

/**
 * Quality constraints for calendar generation
 */
const QUALITY_CONSTRAINTS = {
  MAX_POSTS_PER_SUBREDDIT_PER_WEEK: 2, // Prevent overposting
  MIN_HOURS_BETWEEN_PERSONA_POSTS_IN_SUBREDDIT: 48, // Prevent same persona posting too frequently
  MIN_HOURS_BETWEEN_POST_AND_FIRST_COMMENT: 1, // Realistic engagement timing
  MAX_COMMENTS_PER_POST: 3, // Natural conversation depth
  MIN_COMMENTS_PER_POST: 1, // Ensure engagement
  COMMENT_DELAY_HOURS: [1, 3, 6, 12, 24], // Realistic comment timing
};

/**
 * Generates a content calendar for a given week
 * Focuses on quality: natural posts, threaded comments, proper distribution
 */
export function generateWeekCalendar(
  config: CalendarConfig,
  weekStart: Date
): WeekCalendar {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { personas, subreddits, chatQueries, postsPerWeek, companyInfo } = config;

  // Track posting to prevent overposting
  const subredditPostCounts = new Map<string, number>();
  const personaSubredditLastPost = new Map<string, Map<string, Date>>();
  const posts: RedditPost[] = [];
  const comments: RedditComment[] = [];

  // Initialize tracking
  subreddits.forEach(sub => subredditPostCounts.set(sub.name, 0));
  personas.forEach(persona => {
    personaSubredditLastPost.set(persona.username, new Map());
  });

  // Calculate posts per day
  const postsPerDay = Math.floor(postsPerWeek / 7);
  const extraPosts = postsPerWeek % 7;

  // Generate posts for each day
  let postCounter = 1;
  let globalCommentCounter = 1;
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + day);
    
    const postsToday = postsPerDay + (day < extraPosts ? 1 : 0);

    for (let postNum = 0; postNum < postsToday; postNum++) {
      // Find valid persona-subreddit combination
      const { persona, subreddit, timestamp } = findValidPostSlot(
        personas,
        subreddits,
        currentDate,
        subredditPostCounts,
        personaSubredditLastPost
      );

      if (!persona || !subreddit) {
        // If we can't find a valid slot, skip this post
        continue;
      }

      // Select keywords for this post (1-3 keywords)
      const numKeywords = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
      const selectedKeywords = selectKeywords(chatQueries, numKeywords);

      // Generate natural post
      const post = generateNaturalPost(
        postCounter++,
        subreddit.name,
        persona,
        selectedKeywords,
        companyInfo,
        timestamp
      );

      posts.push(post);

      // Update tracking
      subredditPostCounts.set(subreddit.name, (subredditPostCounts.get(subreddit.name) || 0) + 1);
      const personaMap = personaSubredditLastPost.get(persona.username)!;
      personaMap.set(subreddit.name, timestamp);

      // Generate comments for this post
      const { newComments, nextCommentId } = generateCommentsForPost(
        post,
        personas,
        timestamp,
        config,
        globalCommentCounter
      );
      comments.push(...newComments);
      globalCommentCounter = nextCommentId;
    }
  }

  // Sort by timestamp
  posts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  comments.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    weekStart: new Date(weekStart),
    weekEnd,
    posts,
    comments,
  };
}

/**
 * Finds a valid persona-subreddit combination that doesn't violate quality constraints
 */
function findValidPostSlot(
  personas: CalendarConfig['personas'],
  subreddits: CalendarConfig['subreddits'],
  date: Date,
  subredditPostCounts: Map<string, number>,
  personaSubredditLastPost: Map<string, Map<string, Date>>
): { persona: CalendarConfig['personas'][0] | null; subreddit: CalendarConfig['subreddits'][0] | null; timestamp: Date } {
  // Shuffle for variety
  const shuffledPersonas = [...personas].sort(() => Math.random() - 0.5);
  const shuffledSubreddits = [...subreddits].sort(() => Math.random() - 0.5);

  // Try to find a valid combination
  for (const persona of shuffledPersonas) {
    for (const subreddit of shuffledSubreddits) {
      const postCount = subredditPostCounts.get(subreddit.name) || 0;
      
      // Check subreddit limit
      if (postCount >= QUALITY_CONSTRAINTS.MAX_POSTS_PER_SUBREDDIT_PER_WEEK) {
        continue;
      }

      // Check persona timing
      const personaMap = personaSubredditLastPost.get(persona.username);
      if (personaMap) {
        const lastPostTime = personaMap.get(subreddit.name);
        if (lastPostTime) {
          const hoursSince = (date.getTime() - lastPostTime.getTime()) / (1000 * 60 * 60);
          if (hoursSince < QUALITY_CONSTRAINTS.MIN_HOURS_BETWEEN_PERSONA_POSTS_IN_SUBREDDIT) {
            continue;
          }
        }
      }

      // Found valid slot - generate realistic timestamp (9 AM - 9 PM)
      const hour = 9 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      const timestamp = new Date(date);
      timestamp.setHours(hour, minute, 0, 0);

      return { persona, subreddit, timestamp };
    }
  }

  // If no valid slot found, return first available (fallback)
  const availableSubreddit = subreddits.find(s => (subredditPostCounts.get(s.name) || 0) < QUALITY_CONSTRAINTS.MAX_POSTS_PER_SUBREDDIT_PER_WEEK);
  const timestamp = new Date(date);
  timestamp.setHours(10, 0, 0, 0);

  return {
    persona: shuffledPersonas[0] || null,
    subreddit: availableSubreddit || null,
    timestamp,
  };
}

/**
 * Selects keywords for a post (ensuring variety)
 */
function selectKeywords(
  queries: CalendarConfig['chatQueries'],
  count: number
): CalendarConfig['chatQueries'] {
  const shuffled = [...queries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, queries.length));
}

/**
 * Generates a natural, engaging post
 */
function generateNaturalPost(
  postId: number,
  subreddit: string,
  persona: CalendarConfig['personas'][0],
  keywords: CalendarConfig['chatQueries'],
  companyInfo: CalendarConfig['companyInfo'],
  timestamp: Date
): RedditPost {
  // Generate natural title based on keywords and subreddit context
  const primaryKeyword = keywords[0];
  const title = generateNaturalTitle(primaryKeyword.keyword, subreddit);

  // Generate natural body that feels authentic
  const body = generateNaturalPostBody(primaryKeyword.keyword, persona, subreddit, companyInfo);

  return {
    post_id: `P${postId}`,
    subreddit,
    title,
    body,
    author_username: persona.username,
    timestamp,
    keyword_ids: keywords.map(k => k.keyword_id),
  };
}

/**
 * Generates a natural post title
 */
function generateNaturalTitle(keyword: string, subreddit: string): string {
  const titleTemplates = [
    `Best ${keyword}?`,
    `What's the best ${keyword}?`,
    `Looking for ${keyword} recommendations`,
    `${keyword} - what do you recommend?`,
    `Anyone have experience with ${keyword}?`,
    `What ${keyword} do you use?`,
  ];

  // Add question mark if not present
  const template = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  return template.replace('{keyword}', keyword);
}

/**
 * Generates natural post body
 */
function generateNaturalPostBody(
  keyword: string,
  persona: CalendarConfig['personas'][0],
  subreddit: string,
  companyInfo: CalendarConfig['companyInfo']
): string {
  const lowerInfo = persona.info.toLowerCase();
  const isStartupOps = lowerInfo.includes('startup') || lowerInfo.includes('operations');
  const isConsultant = lowerInfo.includes('consultant') || lowerInfo.includes('client');

  const toneHint = persona.tone ? ` (${persona.tone})` : '';
  const dosHint = persona.dos ? `\n\nDo: ${persona.dos}` : '';
  const dontsHint = persona.donts ? `\nDon’t: ${persona.donts}` : '';

  let body = '';

  if (isStartupOps) {
    body = `Just like it says in the title, what is the best ${keyword}? I'm looking for something that makes high quality output I can edit afterwards. Any help appreciated.${toneHint}`;
  } else if (isConsultant) {
    body = `Hey everyone, I'm working on a project and need recommendations for ${keyword}. Quality and editability are important since I'll be customizing for clients. What's worked well for you?${toneHint}`;
  } else {
    body = `Looking for the best ${keyword}. I need something professional that I can customize. Any suggestions?${toneHint}`;
  }

  return `${body}${dosHint}${dontsHint}`;
}

/**
 * Generates natural comments for a post
 */
function generateCommentsForPost(
  post: RedditPost,
  personas: CalendarConfig['personas'],
  postTimestamp: Date,
  config: CalendarConfig,
  startCommentId: number
): { newComments: RedditComment[]; nextCommentId: number } {
  const comments: RedditComment[] = [];
  const numComments = QUALITY_CONSTRAINTS.MIN_COMMENTS_PER_POST + 
    Math.floor(Math.random() * (QUALITY_CONSTRAINTS.MAX_COMMENTS_PER_POST - QUALITY_CONSTRAINTS.MIN_COMMENTS_PER_POST + 1));

  // Don't use the post author for the first comment (more natural)
  const availablePersonas = personas.filter(p => p.username !== post.author_username);
  if (availablePersonas.length === 0) return { newComments: [], nextCommentId: startCommentId };

  let commentCounter = startCommentId;
  const commentDelays = [...QUALITY_CONSTRAINTS.COMMENT_DELAY_HOURS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numComments; i++) {
    // Select persona (avoid using post author for top-level comments)
    const commenter = availablePersonas[Math.floor(Math.random() * availablePersonas.length)];
    
    // Calculate timestamp (after post, with realistic delay)
    const delayHours = commentDelays[i] || (i + 1);
    const commentTimestamp = new Date(postTimestamp);
    commentTimestamp.setTime(commentTimestamp.getTime() + (delayHours * 60 * 60 * 1000));

    // Generate comment
    const isTopLevel = i === 0 || Math.random() > 0.3; // 70% top-level, 30% replies
    const parentCommentId = isTopLevel ? null : comments[Math.floor(Math.random() * comments.length)]?.comment_id || null;

    const comment = generateNaturalComment(
      commentCounter++,
      post.post_id,
      parentCommentId,
      commenter,
      post,
      config,
      commentTimestamp
    );

    comments.push(comment);
  }

  return { newComments: comments, nextCommentId: commentCounter };
}

/**
 * Generates a natural comment
 */
function generateNaturalComment(
  commentId: number,
  postId: string,
  parentCommentId: string | null,
  persona: CalendarConfig['personas'][0],
  post: RedditPost,
  config: CalendarConfig,
  timestamp: Date
): RedditComment {
  let commentText = '';

  if (parentCommentId) {
    // Reply to another comment
    commentText = generateReplyComment(persona, config);
  } else {
    // Top-level comment responding to post
    commentText = generateTopLevelComment(persona, post, config);
  }

  return {
    comment_id: `C${commentId}`,
    post_id: postId,
    parent_comment_id: parentCommentId,
    comment_text: commentText,
    username: persona.username,
    timestamp,
  };
}

/**
 * Generates a top-level comment
 */
function generateTopLevelComment(
  persona: CalendarConfig['personas'][0],
  post: RedditPost,
  config: CalendarConfig
): string {
  const isStartupOps = persona.info.toLowerCase().includes('startup') || persona.info.toLowerCase().includes('operations');
  const isConsultant = persona.info.toLowerCase().includes('consultant') || persona.info.toLowerCase().includes('client');

  const templates = [];

  const cta = buildCTA(persona, config.companyInfo);

  if (isStartupOps) {
    templates.push(
      `I've been using ${config.companyInfo.name} for this exact use case. It's been a game changer for our team. ${cta}`,
      `Same situation here. We ended up going with ${config.companyInfo.name} and it's worked really well. ${cta}`,
      `${config.companyInfo.name} has been solid for us. The editing capabilities are exactly what you're looking for. ${cta}`
    );
  } else if (isConsultant) {
    templates.push(
      `I use ${config.companyInfo.name} for client work. The quality and customization options are exactly what I need. ${cta}`,
      `Same here. ${config.companyInfo.name} is fine for internal notes but for anything customer facing we end up using it. ${cta}`,
      `For client deliverables, ${config.companyInfo.name} has been my go-to. The output quality is consistent. ${cta}`
    );
  } else {
    templates.push(
      `${config.companyInfo.name} is worth checking out. I've had good results with it. ${cta}`,
      `I'd recommend ${config.companyInfo.name}. It fits what you're describing. ${cta}`,
      `Have you looked at ${config.companyInfo.name}? It might be what you need. ${cta}`
    );
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generates a reply comment
 */
function generateReplyComment(
  persona: CalendarConfig['personas'][0],
  config: CalendarConfig
): string {
  const cta = buildCTA(persona, config.companyInfo);
  const templates = [
    `Agreed. ${config.companyInfo.name} has been reliable for this. ${cta}`,
    `Second this. We use ${config.companyInfo.name} and it's been great. ${cta}`,
    `Same experience here with ${config.companyInfo.name}. ${cta}`,
    `Yep, ${config.companyInfo.name} is solid for this use case. ${cta}`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Builds a subtle CTA based on persona preference
 */
function buildCTA(
  persona: CalendarConfig['personas'][0],
  companyInfo: CalendarConfig['companyInfo']
): string {
  const style = persona.ctaStyle || 'case-study';
  switch (style) {
    case 'invite':
      return `Happy to share what worked for us if you want to compare notes.`;
    case 'resource':
      return `Can drop a short teardown or resource if helpful.`;
    case 'case-study':
    default:
      return `We saw solid lift using ${companyInfo.name}; can share the quick breakdown if useful.`;
  }
}

/**
 * Generates calendar for the current week
 */
export function generateCurrentWeekCalendar(config: CalendarConfig): WeekCalendar {
  const today = new Date();
  const weekStart = getWeekStart(today);
  return generateWeekCalendar(config, weekStart);
}

/**
 * Generates calendar for subsequent weeks
 */
export function generateSubsequentWeekCalendar(
  config: CalendarConfig,
  weekNumber: number
): WeekCalendar {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const targetWeekStart = new Date(currentWeekStart);
  targetWeekStart.setDate(targetWeekStart.getDate() + (weekNumber * 7));
  return generateWeekCalendar(config, targetWeekStart);
}

/**
 * Gets the start of the week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Quality evaluation function
 * Returns a score from 0-10 based on calendar quality
 */
export function evaluateCalendarQuality(calendar: WeekCalendar, config: CalendarConfig): number {
  let score = 10;

  // Check subreddit distribution
  const subredditCounts = new Map<string, number>();
  calendar.posts.forEach(post => {
    subredditCounts.set(post.subreddit, (subredditCounts.get(post.subreddit) || 0) + 1);
  });

  // Penalize overposting
  subredditCounts.forEach((count, subreddit) => {
    if (count > QUALITY_CONSTRAINTS.MAX_POSTS_PER_SUBREDDIT_PER_WEEK) {
      score -= 2;
    }
  });

  // Check persona distribution
  const personaCounts = new Map<string, number>();
  calendar.posts.forEach(post => {
    personaCounts.set(post.author_username, (personaCounts.get(post.author_username) || 0) + 1);
  });

  // Penalize if one persona dominates
  const maxPersonaPosts = Math.max(...Array.from(personaCounts.values()));
  const minPersonaPosts = Math.min(...Array.from(personaCounts.values()));
  if (maxPersonaPosts - minPersonaPosts > 3) {
    score -= 1;
  }

  // Check comment engagement
  const postsWithComments = new Set(calendar.comments.map(c => c.post_id));
  const engagementRate = postsWithComments.size / calendar.posts.length;
  if (engagementRate < 0.8) {
    score -= 1;
  }

  // Check for awkward self-interactions (persona commenting on own post)
  const selfInteractions = calendar.comments.filter(c => {
    const post = calendar.posts.find(p => p.post_id === c.post_id);
    return post && post.author_username === c.username;
  }).length;
  if (selfInteractions > calendar.posts.length * 0.2) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, score));
}
