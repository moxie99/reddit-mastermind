import { atom } from 'nanostores';

export interface CronJobConfig {
  id: string;
  enabled: boolean;
  schedule: string; // Cron expression (e.g., "0 0 * * 1" for every Monday at midnight)
  weeksAhead: number; // How many weeks ahead to generate
  lastRun: Date | null;
  nextRun: Date | null;
  runCount: number;
  createdAt: Date;
}

// Store for cron job configuration
export const cronJobStore = atom<CronJobConfig | null>(null);

// Store for cron job status
export const cronStatusStore = atom<{
  isRunning: boolean;
  lastExecution: Date | null;
  error: string | null;
}>({
  isRunning: false,
  lastExecution: null,
  error: null,
});

/**
 * Default cron schedule: Every Monday at 9 AM
 * Format: minute hour day month dayOfWeek
 */
export const DEFAULT_CRON_SCHEDULE = '0 9 * * 1';

/**
 * Parse cron expression to human-readable format
 */
export function parseCronSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;

  const [minute, hour, day, month, dayOfWeek] = parts;

  // Day of week mapping (0 = Sunday, 1 = Monday, etc.)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  if (dayOfWeek !== '*' && !dayOfWeek.includes(',')) {
    const dayName = days[parseInt(dayOfWeek) || 0];
    const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    return `Every ${dayName} at ${time}`;
  }

  if (schedule === '0 0 * * *') return 'Daily at midnight';
  if (schedule === '0 9 * * 1') return 'Every Monday at 9:00 AM';
  if (schedule === '0 0 * * 1') return 'Every Monday at midnight';

  return schedule;
}

/**
 * Calculate next run time from cron expression
 */
export function calculateNextRun(schedule: string): Date {
  const now = new Date();
  const nextRun = new Date(now);
  
  const parts = schedule.split(' ');
  if (parts.length !== 5) return nextRun;

  const [minute, hour, day, month, dayOfWeek] = parts;

  // Simple calculation for weekly schedule (Monday)
  if (dayOfWeek === '1' && hour !== '*' && minute !== '*') {
    const targetHour = parseInt(hour) || 9;
    const targetMinute = parseInt(minute) || 0;
    
    // Find next Monday
    const currentDay = now.getDay();
    const daysUntilMonday = currentDay === 0 ? 1 : (8 - currentDay) % 7 || 7;
    
    nextRun.setDate(now.getDate() + daysUntilMonday);
    nextRun.setHours(targetHour, targetMinute, 0, 0);
    
    // If it's Monday and time hasn't passed today, use today
    if (currentDay === 1) {
      const todayAtTime = new Date(now);
      todayAtTime.setHours(targetHour, targetMinute, 0, 0);
      if (todayAtTime > now) {
        return todayAtTime;
      }
    }
  }

  return nextRun;
}

