'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { calendarFormSchema, type CalendarFormData } from '@/lib/schemas/calendar-schema';
import { configStore, calendarsStore, currentWeekStore } from '@/lib/stores/calendar-store';
import { generateCurrentWeekCalendar } from '@/lib/algorithms/calendar-generator';
import { Plus, Trash2, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const AVAILABLE_SUBREDDITS = [
  'r/PowerPoint',
  'r/GoogleSlides',
  'r/consulting',
  'r/marketing',
  'r/entrepreneur',
  'r/startups',
  'r/smallbusiness',
  'r/business',
  'r/productivity',
  'r/AskAcademia',
  'r/teachers',
  'r/education',
  'r/Canva',
  'r/ChatGPT',
  'r/ChatGPTPro',
  'r/ClaudeAI',
  'r/artificial',
  'r/design',
  'r/contentcreation',
  'r/presentations',
];

const AVAILABLE_KEYWORDS = [
  { keyword_id: 'K1', keyword: 'best ai presentation maker' },
  { keyword_id: 'K2', keyword: 'ai slide deck tool' },
  { keyword_id: 'K3', keyword: 'pitch deck generator' },
  { keyword_id: 'K4', keyword: 'alternatives to PowerPoint' },
  { keyword_id: 'K5', keyword: 'how to make slides faster' },
  { keyword_id: 'K6', keyword: 'design help for slides' },
  { keyword_id: 'K7', keyword: 'Canva alternative for presentations' },
  { keyword_id: 'K8', keyword: 'Claude vs Slideforge' },
  { keyword_id: 'K9', keyword: 'best tool for business decks' },
  { keyword_id: 'K10', keyword: 'automate my presentations' },
  { keyword_id: 'K11', keyword: 'need help with pitch deck' },
  { keyword_id: 'K12', keyword: 'tools for consultants' },
  { keyword_id: 'K13', keyword: 'tools for startups' },
  { keyword_id: 'K14', keyword: 'best ai design tool' },
  { keyword_id: 'K15', keyword: 'Google Slides alternative' },
  { keyword_id: 'K16', keyword: 'best storytelling tool' },
];

const STEPS = [
  { id: 1, title: 'Company Info', description: 'Basic company information' },
  { id: 2, title: 'ICP Segments', description: 'Target customer segments' },
  { id: 3, title: 'Personas', description: 'Content creator personas' },
  { id: 4, title: 'Subreddits', description: 'Target subreddits' },
  { id: 5, title: 'Keywords', description: 'ChatGPT queries/keywords' },
  { id: 6, title: 'Settings', description: 'Posts per week' },
];

export function CalendarForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CalendarFormData>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      companyInfo: {
        website: '',
        name: '',
        description: '',
        industry: '',
      },
      icpSegments: [
        { segment: '', profile: '', needs: '', whyAppeals: '' },
      ],
      personas: [
        { username: '', name: '', info: '', tone: '', dos: '', donts: '', ctaStyle: 'case-study' },
        { username: '', name: '', info: '', tone: '', dos: '', donts: '', ctaStyle: 'case-study' },
      ],
      subreddits: [],
      chatQueries: [],
      postsPerWeek: 3,
    },
    mode: 'onChange',
  });

  const icpSegmentsArray = useFieldArray({
    control: form.control,
    name: 'icpSegments',
  });

  const personasArray = useFieldArray({
    control: form.control,
    name: 'personas',
  });

  // Subreddits are handled via checkboxes, not field array

  // Keywords are handled via checkboxes, not field array

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CalendarFormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['companyInfo'];
        break;
      case 2:
        fieldsToValidate = ['icpSegments'];
        break;
      case 3:
        fieldsToValidate = ['personas'];
        break;
      case 4:
        fieldsToValidate = ['subreddits'];
        break;
      case 5:
        fieldsToValidate = ['chatQueries'];
        break;
      case 6:
        fieldsToValidate = ['postsPerWeek'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CalendarFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Form submitted with data:', data);
      
      const config = {
        companyInfo: {
          website: data.companyInfo.website,
          name: data.companyInfo.name,
          description: data.companyInfo.description,
          industry: data.companyInfo.industry || '',
        },
        icpSegments: data.icpSegments.map((segment, i) => ({
          id: `icp-${i}`,
          segment: segment.segment,
          profile: segment.profile,
          needs: segment.needs,
          whyAppeals: segment.whyAppeals,
        })),
        personas: data.personas.map((p, i) => ({
          id: `persona-${i}`,
          username: p.username,
          name: p.name,
          info: p.info,
        tone: p.tone,
        dos: p.dos,
        donts: p.donts,
        ctaStyle: p.ctaStyle || 'case-study',
        })),
        subreddits: data.subreddits.map((s, i) => ({
          id: `subreddit-${i}`,
          name: s.name.startsWith('r/') ? s.name : `r/${s.name}`,
        })),
        chatQueries: data.chatQueries.map((q) => ({
          keyword_id: q.keyword_id,
          keyword: q.keyword,
        })),
        postsPerWeek: data.postsPerWeek,
      };

      if (!config.personas.length || !config.subreddits.length || !config.chatQueries.length) {
        throw new Error('Missing required data: personas, subreddits, or queries');
      }

      configStore.set(config);
      const calendar = generateCurrentWeekCalendar(config);
      calendarsStore.set([calendar]);
      currentWeekStore.set(0);
      
      console.log('Calendar generation complete!');
      toast.success('Content calendar generated successfully!');
    } catch (error) {
      console.error('Error generating calendar:', error);
      toast.error('Error generating calendar', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !form.formState.errors.companyInfo;
      case 2:
        return !form.formState.errors.icpSegments;
      case 3:
        return !form.formState.errors.personas;
      case 4:
        return !form.formState.errors.subreddits;
      case 5:
        return !form.formState.errors.chatQueries;
      case 6:
        return !form.formState.errors.postsPerWeek;
      default:
        return true;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reddit Mastermind Configuration</CardTitle>
        <CardDescription>
          Configure your content calendar step by step
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-muted-foreground text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 transition-colors',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Provide basic information about your company
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="companyInfo.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyInfo.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Slideforge" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyInfo.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of your company..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>At least 50 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyInfo.industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: ICP Segments */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ICP Segments</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Define your ideal customer profile segments
                  </p>
                </div>
                <div className="flex items-center justify-end mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => icpSegmentsArray.append({ segment: '', profile: '', needs: '', whyAppeals: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Segment
                  </Button>
                </div>
                {icpSegmentsArray.fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium">Segment {index + 1}</h4>
                      {icpSegmentsArray.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => icpSegmentsArray.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`icpSegments.${index}.segment`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Startup Operators" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`icpSegments.${index}.profile`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Need investor updates..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`icpSegments.${index}.needs`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Needs</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Need investor updates..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`icpSegments.${index}.whyAppeals`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why It Appeals</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Creates structured narratives..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
              </div>
            )}

            {/* Step 3: Personas */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Personas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Define at least 2 personas who will create content (minimum 2 required)
                  </p>
                </div>
                <div className="flex items-center justify-end mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => personasArray.append({ username: '', name: '', info: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Persona
                  </Button>
                </div>
                {personasArray.fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium">Persona {index + 1}</h4>
                      {personasArray.fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => personasArray.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`personas.${index}.username`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="riley_ops" {...field} />
                          </FormControl>
                          <FormDescription>Lowercase, alphanumeric, underscores only</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`personas.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Riley Hart" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <FormField
                    control={form.control}
                    name={`personas.${index}.tone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voice / Tone</FormLabel>
                        <FormControl>
                          <Input placeholder="Warm, concise, helpful; avoid hype" {...field} />
                        </FormControl>
                        <FormDescription>Brief guidance to match brand voice.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <FormField
                      control={form.control}
                      name={`personas.${index}.info`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Backstory / Info</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="I am Riley Hart, the head of operations..." 
                              rows={6}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>At least 50 characters. Include detailed persona background.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <FormField
                    control={form.control}
                    name={`personas.${index}.dos`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do's</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cite real cases, be specific, share metrics, invite questions."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`personas.${index}.donts`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Don'ts</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="No hard sells, no AI buzzwords, avoid generic praise."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`personas.${index}.ctaStyle`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Style</FormLabel>
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={field.value || 'case-study'}
                            onChange={(e) => field.onChange(e.target.value as any)}
                          >
                            <option value="case-study">Case study drop</option>
                            <option value="invite">Invite to chat/DM</option>
                            <option value="resource">Share a resource</option>
                          </select>
                        </FormControl>
                        <FormDescription>Controls how soft the CTA should be.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </Card>
                ))}
              </div>
            )}

            {/* Step 4: Subreddits */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Subreddits</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the subreddits where you want to post content (select at least 1)
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="subreddits"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AVAILABLE_SUBREDDITS.map((subreddit) => (
                          <FormField
                            key={subreddit}
                            control={form.control}
                            name="subreddits"
                            render={({ field }) => {
                              const isChecked = field.value?.some((s: { name: string }) => s.name === subreddit);
                              return (
                                <FormItem
                                  key={subreddit}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, { name: subreddit }]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter((s: { name: string }) => s.name !== subreddit)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex-1">
                                    {subreddit}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 5: Keywords */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ChatGPT Queries / Keywords</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select keywords that will be used to generate content (select at least 1)
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="chatQueries"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AVAILABLE_KEYWORDS.map((keywordItem) => (
                          <FormField
                            key={keywordItem.keyword_id}
                            control={form.control}
                            name="chatQueries"
                            render={({ field }) => {
                              const isChecked = field.value?.some(
                                (q: { keyword_id: string }) => q.keyword_id === keywordItem.keyword_id
                              );
                              return (
                                <FormItem
                                  key={keywordItem.keyword_id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, keywordItem]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (q: { keyword_id: string }) => q.keyword_id !== keywordItem.keyword_id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex-1 space-y-1">
                                    <FormLabel className="font-normal cursor-pointer">
                                      <span className="text-xs text-muted-foreground font-mono mr-2">
                                        {keywordItem.keyword_id}
                                      </span>
                                      <span>{keywordItem.keyword}</span>
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 6: Settings */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in-50">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how many posts to generate per week
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="postsPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posts Per Week</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Number of posts to schedule per week (1-50)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Content Calendar'
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
