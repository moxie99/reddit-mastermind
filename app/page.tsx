import { CalendarForm } from '@/components/calendar-form';
import { CalendarDisplay } from '@/components/calendar-display';
import { CronManager } from '@/components/cron-manager';
import { HotPostIntake } from '@/components/hot-post-intake';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">The Reddit Mastermind</h1>
          <p className="text-muted-foreground text-lg">
            Automate your Reddit content calendar and maximize inbound leads
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
            <CalendarForm />
            <CronManager />
            <HotPostIntake />
          </div>
          <div>
            <CalendarDisplay />
          </div>
        </div>
      </main>
    </div>
  );
}
