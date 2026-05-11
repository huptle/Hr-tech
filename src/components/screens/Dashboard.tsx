'use client';

import React, { useState } from 'react';
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
  X,
  ArrowRight
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';
import { HBarChart, LineChart } from '../Charts';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function StatCard({ label, value, delta, deltaPositive = true, icon: Icon, sub }: any) {
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

function JobRow({ job, onNavigate }: any) {
  return (
    <div className="grid grid-cols-[1.8fr_1fr_1fr_1.3fr_80px] gap-4 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-primary truncate">{job.title}</div>
        <div className="text-[11px] text-text-muted mt-1">{job.dept} · {job.location}</div>
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
        <Button variant="secondary" size="sm" onClick={onNavigate} className="h-7 px-3 text-[11px]">View</Button>
      </div>
    </div>
  );
}

function ActivityRow({ a }: any) {
  const toneMap: any = { new: 'text-accent bg-accent/15', hired: 'text-green-500 bg-green-500/15', rejected: 'text-text-muted bg-surface-3', interview: 'text-amber-500 bg-amber-500/15' };
  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0 group">
      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-text-primary shrink-0 group-hover:border-accent transition-colors">
        {a.who.split(' ').map((p: any) => p[0]).slice(0, 2).join('')}
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
          {/* Animated Background SVG */}
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
            ].map(([text, Icon]: any, i) => (
              <div key={i} className="flex items-center gap-4 text-sm font-medium text-text-primary">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                {text}
              </div>
            ))}
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

export function Dashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const jobs = useAppSelector(state => state.jobs.items);
  const [showPremium, setShowPremium] = useState(false);

  const funnel = [
    { label: 'Applied', value: 248 },
    { label: 'Shortlisted', value: 96 },
    { label: 'Interview', value: 42 },
    { label: 'Offer', value: 11 },
    { label: 'Hired', value: 6 }
  ];

  const dashWeekly = [
    { label: 'W1', value: 18 }, { label: 'W2', value: 27 }, { label: 'W3', value: 34 },
    { label: 'W4', value: 29 }, { label: 'W5', value: 42 }, { label: 'W6', value: 38 },
    { label: 'W7', value: 51 }, { label: 'W8', value: 48 },
  ];

  const activity = [
    { who: 'Priya Menon', what: 'completed the AI technical interview.', tag: 'interview', when: '2 min ago' },
    { who: 'Jordan Reyes', what: 'was shortlisted for Senior DevOps Engineer.', tag: 'new', when: '14 min ago' },
    { who: 'Kenji Watanabe', what: 'accepted the offer for Product Designer II.', tag: 'hired', when: '1 hr ago' },
    { who: 'Sarah Lindqvist', what: 'was moved to rejection pool.', tag: 'rejected', when: '3 hr ago' }
  ];

  const activeJobsCount = jobs.filter((j) => j.status === 'Live').length;

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest">Welcome back!</div>
          <h1 className="text-3xl font-black text-text-primary mt-1 tracking-tight flex items-baseline gap-3">
            {user?.name} 
            <span className="text-sm font-medium text-text-muted tracking-normal">· {user?.role}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Here's what's happening across your hiring journey today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-surface border-border font-bold">
            <FileText size={16} className="mr-2" /> Export report
          </Button>
          <Button className="font-bold" onClick={() => dispatch(setScreen('jobs'))}>
            <Plus size={18} className="mr-2" strokeWidth={3} /> Post a job
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total jobs posted" value="12" delta="+3" icon={Briefcase} sub="2 drafts" />
        <StatCard label="Active jobs" value={String(activeJobsCount)} delta="+1" icon={TrendingUp} sub="currently live" />
        <StatCard label="Active candidates" value="248" delta="+28" icon={Users} sub="across 12 jobs" />
        <StatCard label="Interviews" value="19" delta="6 AI-led" icon={Calendar} sub="4 remaining today" />
        <StatCard label="Offers accepted" value="6" delta="+2" icon={Star} sub="this month" />
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6 items-start">
        {/* Left column: Jobs table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface/50">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Your active jobs</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white ml-1">{jobs.length}</span>
            <div className="ml-auto">
              <select className="bg-surface-2 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-text-secondary outline-none focus:border-accent transition-colors cursor-pointer">
                <option>All departments</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>People</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-[1.8fr_1fr_1fr_1.3fr_80px] gap-4 px-5 py-2.5 bg-surface-2 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border">
            <div>Role</div>
            <div>Applicants</div>
            <div>Status</div>
            <div>Journey</div>
            <div></div>
          </div>
          
          <div className="divide-y divide-border/30">
            {jobs.map((j, i) => (
              <JobRow key={j.id} job={j} onNavigate={() => dispatch(setScreen('jobs'))} />
            ))}
          </div>
          
          <div className="p-4 flex justify-center bg-surface-2/30 border-t border-border/30">
            <Button variant="ghost" className="text-xs font-bold text-accent" onClick={() => dispatch(setScreen('jobs'))}>
              View all 12 jobs <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Right column: Side cards */}
        <div className="flex flex-col gap-6">
          {/* Upcoming interviews */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <h2 className="text-sm font-bold text-text-primary">Upcoming interviews</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">3</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-accent" onClick={() => dispatch(setScreen('schedule'))}>
                Open
              </Button>
            </div>
            
            <div className="flex flex-col gap-4">
              {[
                { name: 'Priya Menon', role: 'Sr DevOps Engineer', when: 'Today · 2:30 PM', mode: 'AI' },
                { name: 'Jordan Reyes', role: 'Sr DevOps Engineer', when: 'Tomorrow · 10:00 AM', mode: 'HR' },
                { name: 'Mei Tanaka', role: 'Product Designer II', when: 'Thu · 4:15 PM', mode: 'AI' }
              ].map((iv, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-black text-text-primary group-hover:border-accent transition-colors shrink-0">
                    {iv.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary">{iv.name}</div>
                    <div className="text-[11px] text-text-muted mt-0.5 font-medium">{iv.role} · {iv.when}</div>
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
          </div>

          {/* AI email studio CTA */}
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

      {/* Analytics & Activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary leading-none">Hiring funnel</h2>
                <p className="text-[10px] text-text-muted mt-1.5 font-bold uppercase tracking-wider">Last 30 days</p>
              </div>
            </div>
            <HBarChart data={funnel} maxVal={248} />
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
            <LineChart data={dashWeekly} height={140} color="#3f64ba" />
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Recent activity</h2>
          </div>
          <div className="flex flex-col">
            {activity.map((a, i) => <ActivityRow key={i} a={a} />)}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}
