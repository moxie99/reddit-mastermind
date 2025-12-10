'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { calendarsStore, currentWeekStore, configStore } from '@/lib/stores/calendar-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, User, Hash, MessageSquare, TrendingUp, Calendar as CalendarIcon, Sparkles, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { generateSubsequentWeekCalendar, evaluateCalendarQuality } from '@/lib/algorithms/calendar-generator';
import { cn } from '@/lib/utils';

export function CalendarDisplay() {
  const calendars = useStore(calendarsStore);
  const currentWeekIndex = useStore(currentWeekStore);
  const config = useStore(configStore);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const currentCalendar = calendars[currentWeekIndex] || calendars[0];
  const qualityScore = config ? evaluateCalendarQuality(currentCalendar, config) : 0;

  const avgComments = calendars.length
    ? Math.round((currentCalendar.comments.length / Math.max(currentCalendar.posts.length, 1)) * 10) / 10
    : 0;
  const engagementRate = calendars.length
    ? Math.round(
        (new Set(currentCalendar.comments.map((c) => c.post_id)).size / Math.max(currentCalendar.posts.length, 1)) *
          100
      )
    : 0;

  if (calendars.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Calendar Generated</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Fill out the form and click &quot;Generate Content Calendar&quot; to see your scheduled posts and comments.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleGenerateNextWeek = () => {
    if (!config) return;
    const nextWeekNumber = calendars.length;
    const newCalendar = generateSubsequentWeekCalendar(config, nextWeekNumber);
    calendarsStore.set([...calendars, newCalendar]);
    currentWeekStore.set(nextWeekNumber);
  };

  const handleWeekChange = (weekIndex: number) => {
    currentWeekStore.set(weekIndex);
  };

  const togglePostExpanded = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  // Group posts by day
  const postsByDay = currentCalendar.posts.reduce((acc, post) => {
    const dayKey = format(post.timestamp, 'yyyy-MM-dd');
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(post);
    return acc;
  }, {} as Record<string, typeof currentCalendar.posts>);

  // Build comment tree for each post
  const buildCommentTree = (postId: string) => {
    const postComments = currentCalendar.comments.filter(c => c.post_id === postId);
    const topLevelComments = postComments.filter(c => !c.parent_comment_id);
    
    const getReplies = (commentId: string) => {
      return postComments.filter(c => c.parent_comment_id === commentId);
    };

    return { topLevelComments, getReplies };
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentCalendar.weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE');
  };

  const qualityColor = qualityScore >= 8 ? 'text-green-600' : qualityScore >= 6 ? 'text-blue-600' : qualityScore >= 4 ? 'text-yellow-600' : 'text-red-600';
  const qualityBg = qualityScore >= 8 ? 'bg-green-50 dark:bg-green-950/20' : qualityScore >= 6 ? 'bg-blue-50 dark:bg-blue-950/20' : qualityScore >= 4 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20';

  return (
    <div className="space-y-4">
      {/* Header with Quality Score and Week Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quality Score Card */}
        <Card className={cn('border-2', qualityBg)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Quality Score</p>
                <p className={cn('text-3xl font-bold', qualityColor)}>{qualityScore}/10</p>
              </div>
              <div className={cn('p-3 rounded-full', qualityBg)}>
                <Sparkles className={cn('h-6 w-6', qualityColor)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {qualityScore >= 8 ? 'Excellent quality' : qualityScore >= 6 ? 'Good quality' : qualityScore >= 4 ? 'Fair quality' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        {/* Week Navigation */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-lg">Week {currentWeekIndex + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(currentCalendar.weekStart, 'MMM d')} - {format(currentCalendar.weekEnd, 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {calendars.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentWeekIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleWeekChange(index)}
                    className="text-xs"
                  >
                    W{index + 1}
                  </Button>
                ))}
                <Button onClick={handleGenerateNextWeek} variant="outline" size="sm" className="text-xs">
                  + Next Week
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{currentCalendar.posts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Posts</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{currentCalendar.comments.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Comments</p>
              </div>
              <Hash className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {new Set(currentCalendar.posts.map((p) => p.subreddit)).size}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Subreddits</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {new Set([...currentCalendar.posts.map((p) => p.author_username), ...currentCalendar.comments.map((c) => c.username)]).size}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Personas</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View - Tabs for Days */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Content Schedule</CardTitle>
          <CardDescription>Posts and comments organized by day</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={format(weekDays[0], 'yyyy-MM-dd')} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-6 h-auto p-1">
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayPosts = postsByDay[dayKey] || [];
                const isActive = isToday(day);
                
                return (
                  <TabsTrigger
                    key={dayKey}
                    value={dayKey}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                      isActive && 'ring-2 ring-primary'
                    )}
                  >
                    <span className="font-medium">{getDayLabel(day)}</span>
                    <span className="text-[10px] opacity-70">{format(day, 'MMM d')}</span>
                    {dayPosts.length > 0 && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {dayPosts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayPosts = postsByDay[dayKey] || [];

              return (
                <TabsContent key={dayKey} value={dayKey} className="mt-0">
                  {dayPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No posts scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayPosts.map((post) => {
                        const { topLevelComments, getReplies } = buildCommentTree(post.post_id);
                        const isExpanded = expandedPosts.has(post.post_id);
                        
                        return (
                          <Card key={post.post_id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div
                              className="cursor-pointer"
                              onClick={() => togglePostExpanded(post.post_id)}
                            >
                              <CardContent className="pt-4 pb-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                                        {post.title}
                                      </h4>
                                      <Badge variant="secondary" className="shrink-0 text-xs">
                                        {post.subreddit}
                                      </Badge>
                                    </div>
                                    
                                    {isExpanded && (
                                      <p className="text-sm text-foreground mb-3 whitespace-pre-line line-clamp-3">
                                        {post.body}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{post.author_username}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{format(post.timestamp, 'HH:mm')}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        <span className="truncate">{post.keyword_ids.join(', ')}</span>
                                      </div>
                                      {topLevelComments.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-3 w-3" />
                                          <span>{topLevelComments.length}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight
                                    className={cn(
                                      'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
                                      isExpanded && 'rotate-90'
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="border-t bg-muted/30">
                                <CardContent className="pt-4 pb-4">
                                  {topLevelComments.length > 0 ? (
                                    <div className="space-y-3">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Comments</p>
                                      {topLevelComments.map((comment) => {
                                        const replies = getReplies(comment.comment_id);
                                        return (
                                          <div key={comment.comment_id} className="space-y-2">
                                            <div className="bg-background rounded-lg p-3 border">
                                              <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-medium text-foreground">
                                                  u/{comment.username}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {format(comment.timestamp, 'MMM d, HH:mm')}
                                                </span>
                                              </div>
                                              <p className="text-sm text-foreground whitespace-pre-line">
                                                {comment.comment_text}
                                              </p>
                                            </div>
                                            
                                            {replies.length > 0 && (
                                              <div className="ml-6 space-y-2">
                                                {replies.map((reply) => (
                                                  <div key={reply.comment_id} className="bg-background rounded-lg p-2.5 border border-muted">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-medium text-foreground">
                                                        u/{reply.username}
                                                      </span>
                                                      <span className="text-xs text-muted-foreground">
                                                        {format(reply.timestamp, 'MMM d, HH:mm')}
                                                      </span>
                                                    </div>
                                                    <p className="text-xs text-foreground whitespace-pre-line">
                                                      {reply.comment_text}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No comments yet
                                    </p>
                                  )}
                                </CardContent>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-2xl font-bold">{currentCalendar.posts.length}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{currentCalendar.comments.length}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(currentCalendar.posts.map((p) => p.subreddit)).size}
              </p>
              <p className="text-sm text-muted-foreground">Subreddits</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set([...currentCalendar.posts.map((p) => p.author_username), ...currentCalendar.comments.map((c) => c.username)]).size}
              </p>
              <p className="text-sm text-muted-foreground">Active Personas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{avgComments}</p>
              <p className="text-sm text-muted-foreground">Avg Comments/Post</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{engagementRate}%</p>
              <p className="text-sm text-muted-foreground">Posts w/ Comments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
