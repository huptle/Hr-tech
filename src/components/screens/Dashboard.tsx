'use client';

import React, { ComponentType, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Plus,
  FileText,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Mail,
  X,
  ArrowRight
} from 'lucide-react';
import { HBarChart, LineChart } from '../Charts';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  sub?: string;
};

function StatCard({ label, value, delta, deltaPositive = true, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-accent/40 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">{value}</div>
      <div className="flex items-center gap-2 text-[11px] mt-1">
        {delta && (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold",
            deltaPositive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
          )}>
            <TrendingUp size={10} /> {delta}
          </span>
        )}
        {sub && <span className="text-text-muted font-medium">{sub}</span>}
      </div>
    </div>
  );
}

export type DashboardJob = {
  id: string;
  title: string;
  dept: string;
  location: string;
  applicants: number;
  status: string;
  progress?: number;
};

function JobRow({ job }: { job: DashboardJob }) {
  return (
    <div className="grid grid-cols-[1.8fr_1fr_1fr_1.3fr_80px] gap-4 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-primary truncate">{job.title}</div>
        <div className="text-[11px] text-text-muted mt-1">{job.dept || '—'} · {job.location || '—'}</div>
      </div>
      <div className="text-xs font-medium text-text-secondary">{job.applicants} applicants</div>
      <div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-bold border",
          job.status === 'Live' ? "bg-green-500/15 text-green-500 border-green-500/20" :
          job.status === 'Draft' ? "bg-surface-3 text-text-muted border-border" :
          "bg-accent/15 text-accent border-accent/20"
        )}>
          {job.status}
        </span>
      </div>
      <div className="pr-4">
        <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${job.progress || 0}%` }} />
        </div>
        <div className="text-[10px] text-text-muted mt-2 font-medium">{job.progress || 0}% through journey</div>
      </div>
      <div className="flex justify-end">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center h-7 px-3 rounded-lg bg-surface-2 border border-border text-[11px] font-bold text-text-primary hover:border-accent/40 transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export type DashboardActivity = {
  who: string;
  what: string;
  tag: 'new' | 'hired' | 'rejected' | 'interview' | 'job' | 'template';
  when: string;
};

function ActivityRow({ a }: { a: DashboardActivity }) {
  const toneMap: Record<DashboardActivity['tag'], string> = {
    new: 'text-accent bg-accent/15',
    hired: 'text-green-500 bg-green-500/15',
    rejected: 'text-text-muted bg-surface-3',
    interview: 'text-amber-500 bg-amber-500/15',
    job: 'text-blue-500 bg-blue-500/15',
    template: 'text-violet-500 bg-violet-500/15',
  };
  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0 group">
      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-text-primary shrink-0 group-hover:border-accent transition-colors">
        {a.who.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-primary leading-snug">
          <span className="font-bold">{a.who}</span> <span className="text-text-secondary">{a.what}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", toneMap[a.tag])}>
            {a.tag}
          </span>
          <span className="text-[10px] text-text-muted font-medium">{a.when}</span>
        </div>
      </div>
    </div>
  );
}

function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] bg-surface border border-accent/30 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-accent p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
            <svg width="260" height="140" viewBox="0 0 260 140">
              <circle cx="200" cy="60" r="110" fill="white" />
              <circle cx="60" cy="120" r="60" fill="white" />
            </svg>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Huptle AI Agents</div>
              <div className="text-2xl font-black text-white tracking-tight">Upgrade to Premium</div>
            </div>
          </div>
          <p className="mt-6 text-white/80 text-sm leading-relaxed max-w-sm">
            Unlock Huptle AI Agents to fully automate interview scheduling, candidate communications, and personalised offer emails — all hands-free.
          </p>
        </div>

        <div className="p-8">
          <div className="flex flex-col gap-4 mb-8">
            {[
              ['Auto-schedule interviews across time zones', Calendar],
              ['AI-drafted invite, shortlist & offer emails', Mail],
              ['Personalised rejection emails with feedback', MessageSquare],
              ['Real-time candidate status updates', Users]
            ].map((row, i) => {
              const [text, Icon] = row as [string, ComponentType<{ size?: number }>];
              return (
                <div key={i} className="flex items-center gap-4 text-sm font-medium text-text-primary">
                  <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  {text}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 h-12 text-base rounded-2xl font-bold">
              Upgrade now — from $49/mo <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="ghost" onClick={onClose} className="h-12 px-6 font-bold">Maybe later</Button>
          </div>
          <p className="mt-6 text-[11px] text-text-muted text-center font-medium">No commitment · cancel anytime · 14-day free trial</p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    </div>
  );
}

export type DashboardUpcoming = {
  id: string;
  candidateName: string;
  jobTitle: string;
  when: string;
  mode: 'AI' | 'HR';
};

export type DashboardStats = {
  totalJobs: number;
  draftJobs: number;
  activeJobs: number;
  totalCandidates: number;
  newCandidates7d: number;
  totalInterviews: number;
  aiInterviews: number;
  remainingToday: number;
  offersAccepted: number;
  newOffers30d: number;
};

export type DashboardFunnel = { label: string; value: number }[];
export type DashboardWeekly = { label: string; value: number }[];

export type DashboardProps = {
  user: { name: string; role: string };
  jobs: DashboardJob[];
  totalJobsCount: number;
  upcoming: DashboardUpcoming[];
  activity: DashboardActivity[];
  stats: DashboardStats;
  funnel: DashboardFunnel;
  weekly: DashboardWeekly;
};

export function Dashboard({
  user,
  jobs,
  totalJobsCount,
  upcoming,
  activity,
  stats,
  funnel,
  weekly,
}: DashboardProps) {
  const [showPremium, setShowPremium] = useState(false);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest">Welcome back!</div>
          <h1 className="text-3xl font-black text-text-primary mt-1 tracking-tight flex items-baseline gap-3">
            {user.name}
            <span className="text-sm font-medium text-text-muted tracking-normal">· {user.role}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Here&apos;s what&apos;s happening across your hiring journey today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:border-accent/40 transition-colors"
          >
            <FileText size={16} /> Export report
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            <Plus size={18} strokeWidth={3} /> Post a job
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total jobs posted" value={String(stats.totalJobs)} delta={stats.draftJobs > 0 ? `${stats.draftJobs} drafts` : undefined} icon={Briefcase} sub={`${stats.activeJobs} live`} />
        <StatCard label="Active jobs" value={String(stats.activeJobs)} icon={TrendingUp} sub="currently live" />
        <StatCard label="Active candidates" value={String(stats.totalCandidates)} delta={stats.newCandidates7d > 0 ? `+${stats.newCandidates7d}` : undefined} icon={Users} sub="across all jobs" />
        <StatCard label="Interviews" value={String(stats.totalInterviews)} delta={stats.aiInterviews > 0 ? `${stats.aiInterviews} AI-led` : undefined} icon={Calendar} sub={`${stats.remainingToday} remaining today`} />
        <StatCard label="Offers accepted" value={String(stats.offersAccepted)} delta={stats.newOffers30d > 0 ? `+${stats.newOffers30d}` : undefined} icon={Star} sub="this month" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6 items-start">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface/50">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Your active jobs</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white ml-1">{totalJobsCount}</span>
          </div>

          <div className="grid grid-cols-[1.8fr_1fr_1fr_1.3fr_80px] gap-4 px-5 py-2.5 bg-surface-2 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">
            <div>Role</div>
            <div>Applicants</div>
            <div>Status</div>
            <div>Journey</div>
            <div></div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-text-muted">No jobs yet — post your first one to get started.</p>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 mt-4 rounded-xl gradient-bg px-4 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} /> Post a job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {jobs.map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </div>
          )}

          {totalJobsCount > jobs.length && (
            <div className="p-4 flex justify-center bg-surface-2/30 border-t border-border/30">
              <Link href="/jobs" className="text-xs font-bold text-accent flex items-center gap-2 hover:underline">
                View all {totalJobsCount} jobs <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <h2 className="text-sm font-bold text-text-primary">Upcoming interviews</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{upcoming.length}</span>
              </div>
              <Link href="/schedule" className="h-7 text-xs font-bold text-accent inline-flex items-center px-2">
                Open
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">No upcoming interviews scheduled.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((iv) => (
                  <div key={iv.id} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-black text-text-primary group-hover:border-accent transition-colors shrink-0">
                      {iv.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-text-primary truncate">{iv.candidateName}</div>
                      <div className="text-[11px] text-text-muted mt-0.5 font-medium truncate">{iv.jobTitle} · {iv.when}</div>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold",
                      iv.mode === 'AI' ? "bg-accent/15 text-accent" : "bg-surface-3 text-text-muted"
                    )}>
                      {iv.mode === 'AI' ? <Bot size={12} /> : <User size={12} />}
                      {iv.mode}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-accent/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 text-accent/5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0">
              <Sparkles size={120} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                <Sparkles size={16} />
              </div>
              <h2 className="text-sm font-bold text-text-primary">AI email studio</h2>
              <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded ml-auto">Premium</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Automate invite, rejection & offer emails with Huptle AI Agents. Fully hands-free scheduling for your entire pipeline.
            </p>
            <Button size="sm" className="mt-5 w-full font-bold shadow-md shadow-accent/20" onClick={() => setShowPremium(true)}>
              Try it on a slot
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary leading-none">Hiring funnel</h2>
                <p className="text-[10px] text-text-muted mt-1.5 font-bold uppercase tracking-wider">All-time</p>
              </div>
            </div>
            <HBarChart data={funnel} maxVal={Math.max(...funnel.map(f => f.value), 1)} />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary leading-none">Weekly applicants</h2>
                <p className="text-[10px] text-text-muted mt-1.5 font-bold uppercase tracking-wider">Last 8 weeks</p>
              </div>
            </div>
            <LineChart data={weekly} height={140} color="#3f64ba" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Recent activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">No activity yet.</p>
          ) : (
            <div className="flex flex-col">
              {activity.map((a, i) => <ActivityRow key={i} a={a} />)}
            </div>
          )}
        </div>
      </div>

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}
