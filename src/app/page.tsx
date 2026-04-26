import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="flex items-start gap-4 p-6 rounded-lg border border-border/40 bg-surface/30 hover:bg-surface/60 transition-colors">
    <div className="mt-1 p-2 rounded bg-surface border border-border/50">
      <Icon className="h-5 w-5 text-accent-2" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="font-medium text-text-primary text-base tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-accent/20">
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16 sm:pt-32 flex flex-col">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start pb-20 border-b border-border/30">
          <div className="flex-1 max-w-2xl">
            <div>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-6">
                Hiring Excellence
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-text-primary leading-[1.1]">
                A refined approach to building exceptional teams.
              </h1>
            </div>

            <p className="mt-8 text-base sm:text-lg leading-relaxed text-text-secondary font-light max-w-xl">
              Streamline your recruitment lifecycle with elegant tools designed for precision. From
              initial contact to final offer, manage your candidate pipeline with clarity and
              confidence.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/jobs"
                className="px-6 py-3 rounded text-sm font-medium bg-text-primary text-background hover:bg-text-secondary transition-colors"
              >
                Start Hiring
              </Link>
              <Link
                href="/overview"
                className="px-6 py-3 rounded text-sm font-medium text-text-primary border border-border/50 hover:bg-surface transition-colors flex items-center gap-2 group"
              >
                View Pipeline
                <ArrowRight
                  className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>

          <div className="flex-1 md:bg-surface/20 md:p-8 rounded-xl md:border border-border/20 md:mt-12">
            <div className="flex gap-2 text-accent-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <CheckCircle2 key={i} className="h-4 w-4" strokeWidth={1.5} />
              ))}
            </div>
            <p className="text-lg text-text-primary italic font-serif leading-relaxed">
              &ldquo;The foundation of any great enterprise relies on the careful, deliberate selection
              of its people. We provide the infrastructure for those critical decisions.&rdquo;
            </p>
            <p className="mt-4 text-sm text-text-muted tracking-wide uppercase">
              — The Huptle Standard
            </p>
          </div>
        </div>

        <div className="py-24">
          <div className="mb-12">
            <h2 className="text-2xl font-normal tracking-tight text-text-primary">Core Capabilities</h2>
            <p className="mt-2 text-sm text-text-muted max-w-xl">
              Thoughtfully engineered tools to support every stage of your recruitment process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <FeatureCard
              icon={Briefcase}
              title="Structured Postings"
              description="Draft and manage job descriptions with standardized formats that ensure clarity and attract the right professionals."
            />
            <FeatureCard
              icon={Users}
              title="Candidate Profiles"
              description="Maintain comprehensive, neatly organized dossiers for every applicant, keeping decision-making centralized."
            />
            <FeatureCard
              icon={Calendar}
              title="Seamless Coordination"
              description="Arrange interviews and sync calendars without the friction of endless back-and-forth communication."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Clear Communication"
              description="Keep candidates informed with timely, professional updates reflecting your organization's standards."
            />
            <FeatureCard
              icon={FileText}
              title="Evaluation Rubrics"
              description="Assess candidates objectively using shared, customizable scorecards to ensure fair comparisons."
            />
            <FeatureCard
              icon={BarChart}
              title="Pipeline Optics"
              description="Gain high-level visibility into your hiring funnel with elegant, easy-to-read metric summaries."
            />
          </div>
        </div>

        <div className="border-t border-border/30 pt-16 pb-8 text-center">
          <h2 className="text-xl font-normal text-text-primary mb-6">Experience a better way to hire.</h2>
          <Link
            href="/jobs"
            className="text-sm border-b border-accent-2 text-accent-2 pb-0.5 hover:text-accent hover:border-accent transition-colors"
          >
            Initialize your workspace
          </Link>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-xs text-text-muted font-light tracking-wide">
            &copy; {new Date().getFullYear()} Huptle Human Resources Infrastructure.
          </p>
        </footer>
      </main>
    </div>
  );
}
