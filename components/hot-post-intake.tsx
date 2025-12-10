'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { configStore } from '@/lib/stores/calendar-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function HotPostIntake() {
  const config = useStore(configStore);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [subreddit, setSubreddit] = useState<string>('');
  const [postTitle, setPostTitle] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [suggestedComment, setSuggestedComment] = useState('');

  const persona = useMemo(
    () => config?.personas.find((p) => p.username === selectedPersona),
    [config, selectedPersona]
  );
  const keyword = useMemo(
    () => config?.chatQueries.find((k) => k.keyword_id === selectedKeyword),
    [config, selectedKeyword]
  );

  const handleGenerate = () => {
    if (!config) {
      toast.warning('Configuration Required', {
        description: 'Generate a calendar first so we have personas and keywords.',
      });
      return;
    }
    if (!persona || !keyword || !subreddit || !postTitle) {
      toast.warning('Missing Fields', {
        description: 'Pick a persona, keyword, subreddit, and add a post title.',
      });
      return;
    }

    const cta = buildCTA(persona, config.companyInfo);
    const voice = persona.tone ? `(${persona.tone})` : '';
    const dos = persona.dos ? `Do: ${persona.dos}` : '';
    const donts = persona.donts ? `Don't: ${persona.donts}` : '';

    const comment = [
      `Re: "${postTitle}"`,
      `Quick take from u/${persona.username} ${voice}`,
      '',
      keyword.keyword
        ? `On ${keyword.keyword}: we've tested a few approaches, and the cleanest wins were the ones that balanced speed with editability.`
        : '',
      persona.info ? `Context: ${persona.info.slice(0, 180)}...` : '',
      '',
      cta,
      dos || '',
      donts || '',
      postUrl ? `Link: ${postUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    setSuggestedComment(comment);
    toast.success('Draft comment generated');
  };

  if (!config) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hot Post Intake</CardTitle>
        <CardDescription>Quickly craft a reply for a live Reddit post</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Subreddit</Label>
            <Input
              placeholder="r/startups"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
            />
          </div>
          <div>
            <Label>Persona</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
            >
              <option value="">Select persona</option>
              {config.personas.map((p) => (
                <option key={p.id} value={p.username}>
                  {p.name} ({p.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Keyword / Query</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
            >
              <option value="">Select keyword</option>
              {config.chatQueries.map((k) => (
                <option key={k.keyword_id} value={k.keyword_id}>
                  {k.keyword_id} — {k.keyword}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Post URL (optional)</Label>
            <Input
              placeholder="https://reddit.com/r/startups/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Post Title</Label>
          <Input
            placeholder="Example: Best AI presentation maker?"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
        </div>

        <Button onClick={handleGenerate} className="w-full">
          Generate Comment Draft
        </Button>

        {suggestedComment && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Draft</Badge>
              <span className="text-xs text-muted-foreground">Ready to copy</span>
            </div>
            <Textarea value={suggestedComment} readOnly rows={8} className="font-mono text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildCTA(
  persona: {
    ctaStyle?: 'case-study' | 'invite' | 'resource';
  },
  companyInfo: { name: string }
): string {
  const style = persona.ctaStyle || 'case-study';
  switch (style) {
    case 'invite':
      return `If it's useful, happy to share what worked for us—DMs open.`;
    case 'resource':
      return `Can share a short teardown or resource we used to get wins quickly.`;
    case 'case-study':
    default:
      return `${companyInfo.name} helped us ship faster; I can drop the short breakdown if helpful.`;
  }
}

