import { NextRequest, NextResponse } from 'next/server';
import type { CalendarConfig } from '@/lib/stores/calendar-store';
import { generateSubsequentWeekCalendar } from '@/lib/algorithms/calendar-generator';

/**
 * API Route for cron job to generate subsequent weeks
 * This can be called by:
 * - Vercel Cron Jobs (vercel.json) - sends GET request with Authorization header
 * - External cron services (cron-job.org, etc.) - can use POST or GET
 * - Manual trigger from UI - uses POST with config in body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, weekNumber } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      );
    }

    // Validate config structure
    if (!config.personas || !config.subreddits || !config.chatQueries) {
      return NextResponse.json(
        { error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    // Generate calendar for the specified week
    const weekNum = weekNumber || 1;
    const calendar = generateSubsequentWeekCalendar(config as CalendarConfig, weekNum);

    return NextResponse.json({
      success: true,
      calendar,
      weekNumber: weekNum,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate calendar',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for Vercel Cron Jobs and health checks
 * Vercel Cron sends GET requests with Authorization header
 * For production, you'd need to store config in a database
 * For now, this is a health check endpoint
 */
export async function GET(request: NextRequest) {
  // Check if this is a Vercel Cron request
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isVercelCron) {
    // In production, fetch config from database here
    // For now, return a message that config is needed
    return NextResponse.json({
      status: 'ok',
      message: 'Vercel Cron job triggered. In production, fetch config from database and generate calendar.',
      timestamp: new Date().toISOString(),
    });
  }

  // Health check
  return NextResponse.json({
    status: 'ok',
    service: 'reddit-mastermind-cron',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'Send config and weekNumber in body to generate calendar',
      GET: 'Health check endpoint',
    },
  });
}

