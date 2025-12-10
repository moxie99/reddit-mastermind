'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { configStore, calendarsStore } from '@/lib/stores/calendar-store';
import { cronJobStore, cronStatusStore, DEFAULT_CRON_SCHEDULE, parseCronSchedule, calculateNextRun } from '@/lib/stores/cron-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Play, Pause, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CronManager() {
  const config = useStore(configStore);
  const cronJob = useStore(cronJobStore);
  const cronStatus = useStore(cronStatusStore);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState(DEFAULT_CRON_SCHEDULE);
  const [weeksAhead, setWeeksAhead] = useState(1);

  useEffect(() => {
    // Load saved cron job config from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cronJobConfig');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          cronJobStore.set(parsed);
          setSchedule(parsed.schedule || DEFAULT_CRON_SCHEDULE);
          setWeeksAhead(parsed.weeksAhead || 1);
        } catch (e) {
          console.error('Failed to load cron config:', e);
        }
      }
    }
  }, []);

  const handleSaveCronConfig = () => {
    if (!config) {
      toast.warning('Configuration Required', {
        description: 'Please generate a calendar first to save cron configuration',
      });
      return;
    }

    const nextRun = calculateNextRun(schedule);
    const cronConfig = {
      id: 'main-cron-job',
      enabled: cronJob?.enabled || false,
      schedule,
      weeksAhead,
      lastRun: cronJob?.lastRun || null,
      nextRun,
      runCount: cronJob?.runCount || 0,
      createdAt: cronJob?.createdAt || new Date(),
    };

    cronJobStore.set(cronConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cronJobConfig', JSON.stringify(cronConfig));
    }
    toast.success('Cron job configuration saved!');
  };

  const handleToggleCron = () => {
    if (!config) {
      toast.warning('Configuration Required', {
        description: 'Please generate a calendar first',
      });
      return;
    }

    const newConfig = {
      ...cronJob!,
      enabled: !cronJob?.enabled,
    };
    cronJobStore.set(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cronJobConfig', JSON.stringify(newConfig));
    }
  };

  const handleManualRun = async () => {
    if (!config) {
      toast.warning('Configuration Required', {
        description: 'Please generate a calendar first',
      });
      return;
    }

    setIsLoading(true);
    cronStatusStore.set({ ...cronStatus, isRunning: true, error: null });

    try {
      const response = await fetch('/api/cron/generate-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          weekNumber: weeksAhead,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }

      // Update cron job status
      const updatedConfig = {
        ...cronJob!,
        lastRun: new Date(),
        runCount: (cronJob?.runCount || 0) + 1,
        nextRun: calculateNextRun(schedule),
      };
      cronJobStore.set(updatedConfig);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cronJobConfig', JSON.stringify(updatedConfig));
      }

      cronStatusStore.set({
        isRunning: false,
        lastExecution: new Date(),
        error: null,
      });

      // Add the generated calendar to the calendars store
      const currentCalendars = calendarsStore.get();
      calendarsStore.set([...currentCalendars, data.calendar]);

      toast.success('Calendar Generated', {
        description: `Successfully generated calendar for week ${weeksAhead}! The calendar has been added to your list.`,
      });
    } catch (error) {
      console.error('Cron execution error:', error);
      cronStatusStore.set({
        isRunning: false,
        lastExecution: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Cron Job Failed', {
        description: error instanceof Error ? error.message : 'Failed to run cron job',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cron Job Manager</CardTitle>
          <CardDescription>Automatically generate calendars for subsequent weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Generate a calendar first to enable cron job scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cron Job Manager</CardTitle>
            <CardDescription>Automatically generate calendars for subsequent weeks</CardDescription>
          </div>
          {cronJob?.enabled && (
            <Badge variant="default" className="bg-green-600">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="cron-enabled" className="text-base font-medium">
              Enable Automatic Generation
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate calendars based on schedule
            </p>
          </div>
          <Switch
            id="cron-enabled"
            checked={cronJob?.enabled || false}
            onCheckedChange={handleToggleCron}
          />
        </div>

        {/* Schedule Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="cron-schedule">Cron Schedule</Label>
            <Input
              id="cron-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 9 * * 1"
              className="mt-1 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: minute hour day month dayOfWeek (e.g., "0 9 * * 1" = Every Monday at 9 AM)
            </p>
            {schedule && (
              <p className="text-sm text-foreground mt-2">
                <Clock className="h-3 w-3 inline mr-1" />
                {parseCronSchedule(schedule)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="weeks-ahead">Weeks Ahead to Generate</Label>
            <Input
              id="weeks-ahead"
              type="number"
              min={1}
              max={12}
              value={weeksAhead}
              onChange={(e) => setWeeksAhead(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many weeks ahead to generate when cron runs
            </p>
          </div>

          <Button onClick={handleSaveCronConfig} className="w-full" variant="outline">
            Save Configuration
          </Button>
        </div>

        {/* Manual Trigger */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Manual Trigger</h4>
              <p className="text-sm text-muted-foreground">
                Test the cron job by running it manually
              </p>
            </div>
            <Button
              onClick={handleManualRun}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Information */}
        {cronJob && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="font-medium">Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Last Run</p>
                <p className="font-medium">
                  {cronJob.lastRun ? format(new Date(cronJob.lastRun), 'MMM d, yyyy HH:mm') : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Next Run</p>
                <p className="font-medium">
                  {cronJob.nextRun ? format(new Date(cronJob.nextRun), 'MMM d, yyyy HH:mm') : 'Not scheduled'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Runs</p>
                <p className="font-medium">{cronJob.runCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {cronJob.enabled ? (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {cronStatus.error && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Last Error</p>
                <p className="text-xs text-destructive/80">{cronStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Setup Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>For Vercel Deployment:</strong> Add a cron job in <code className="text-xs bg-muted px-1 py-0.5 rounded">vercel.json</code> that calls <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/cron/generate-week</code>
            </p>
            <p>
              <strong>For External Services:</strong> Use cron-job.org or similar to call your API endpoint at the scheduled time
            </p>
            <p>
              <strong>For Local Development:</strong> Use the "Run Now" button to test manually
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

