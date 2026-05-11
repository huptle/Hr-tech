'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Briefcase, 
  Users, 
  ChevronDown, 
  Star, 
  Mail, 
  Calendar, 
  ArrowRight, 
  FileDown,
  Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const JOURNEY_STEPS = ['Applied', 'Resume Received', 'Shortlisted', 'Round 1', 'Round 2', 'Round 3', 'Offer Sent', 'Offer Accepted'];

function JourneyBar({ current }: { current: string }) {
  const steps = JOURNEY_STEPS;
  const idx = steps.indexOf(current);
  
  return (
    <div className="flex items-center gap-0 mt-2 mb-1 w-full max-w-[280px]">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 group relative">
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300",
                done ? "bg-green-500" : active ? "bg-accent ring-4 ring-accent/15" : "bg-surface-3 border border-border"
              )} />
              <div className="absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border px-2 py-1 rounded-md text-[9px] font-bold text-text-primary z-20 pointer-events-none whitespace-nowrap shadow-xl">
                {s}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-[2px] flex-1 min-w-[8px] transition-colors duration-500",
                done ? "bg-green-500" : "bg-border"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ShortlistJobCard({ group }: { group: any }) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const { jobId, jobTitle, candidates } = group;

  const journeyTally = useMemo(() => {
    const t: any = {};
    candidates.forEach((c: any) => { t[c.journey] = (t[c.journey] || 0) + 1; });
    return Object.entries(t).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
  }, [candidates]);

  return (
    <motion.div 
      layout
      className={cn(
        "bg-surface border rounded-2xl overflow-hidden transition-all duration-300",
        expanded ? "border-accent shadow-xl shadow-accent/5" : "border-border shadow-sm hover:border-border-strong"
      )}
    >
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
          <Briefcase size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-text-primary truncate">{jobTitle}</h3>
            <span className="font-mono text-[10px] text-text-muted bg-surface-2 px-2 py-0.5 rounded border border-border">{jobId}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {journeyTally.map(([stage, count]: any) => (
              <span key={stage} className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                stage.includes('Offer') ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                stage.includes('Round') ? "bg-accent/10 text-accent border-accent/20" : 
                "bg-surface-3 text-text-muted border-border"
              )}>
                {count} · {stage}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border rounded-xl">
            <Users size={14} className="text-accent" />
            <span className="text-xs font-bold text-text-primary">{candidates.length}</span>
          </div>
          
          <button 
            className={cn(
              "p-2 rounded-lg border border-border transition-all duration-300",
              expanded ? "bg-accent/10 text-accent border-accent/20" : "bg-surface-2 text-text-muted"
            )}
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown size={16} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-surface-2/30"
          >
            <div className="px-5 py-2.5 bg-surface-2 text-[10px] font-bold text-text-muted uppercase tracking-wider grid grid-cols-[36px_1.5fr_1fr_80px_160px] gap-4 border-b border-border">
              <div />
              <div>Candidate</div>
              <div>Stage</div>
              <div className="text-center">Score</div>
              <div className="text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-border/20">
              {candidates.map((c: any, i: number) => {
                const initials = c.name.split(' ').map((n: string) => n[0]).join('');
                return (
                  <div key={c.id} className="grid grid-cols-[36px_1.5fr_1fr_80px_160px] gap-4 items-start px-5 py-4 hover:bg-surface-2/50 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-1">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-text-primary truncate">{c.name}</div>
                      <div className="text-[10px] text-text-muted font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="font-mono">{c.id}</span>
                        <span>·</span>
                        <span className="truncate">{c.location}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {c.availability}</span>
                      </div>
                      <JourneyBar current={c.journey} />
                    </div>
                    <div className="pt-1.5">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap",
                        c.journey.includes('Offer') ? "bg-green-500/15 text-green-500 border-green-500/20" : 
                        c.journey.includes('Round') ? "bg-accent/15 text-accent border-accent/20" : 
                        "bg-surface-3 text-text-muted border-border"
                      )}>
                        {c.journey}
                      </span>
                    </div>
                    <div className="pt-1.5 text-center">
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center gap-1 border mx-auto w-fit",
                        c.score > 85 ? "bg-green-500/15 text-green-500 border-green-500/20" : "bg-accent/15 text-accent border-accent/20"
                      )}>
                        <Star size={10} className="fill-current" /> {c.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-bold">
                        <Mail size={12} className="mr-1.5" /> Email
                      </Button>
                      <Button size="sm" className="h-8 px-3 text-[10px] font-bold" onClick={() => dispatch(setScreen('schedule'))}>
                        <Calendar size={12} className="mr-1.5" /> Schedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-surface-2/50 flex justify-between items-center border-t border-border">
              <span className="text-[10px] text-text-muted font-bold ml-1 uppercase tracking-widest">
                {candidates.length} candidates in pipeline
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-bold text-accent"
                onClick={() => dispatch(setScreen('jobs'))}
              >
                View in Jobs <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Shortlist() {
  const dispatch = useAppDispatch();
  const allCandidates = useAppSelector(state => state.candidates.items);
  const jobs = useAppSelector(state => state.jobs.items);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob] = useState('all');

  const groups = useMemo(() => {
    const filtered = allCandidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJob = filterJob === 'all' || c.jobId === filterJob;
      return matchesSearch && matchesJob;
    });

    const map: any = {};
    filtered.forEach(c => {
      if (!map[c.jobId]) {
        map[c.jobId] = { 
          jobId: c.jobId, 
          jobTitle: c.jobTitle, 
          candidates: [] 
        };
      }
      map[c.jobId].candidates.push(c);
    });

    return Object.values(map).sort((a: any, b: any) => b.candidates.length - a.candidates.length);
  }, [allCandidates, searchQuery, filterJob]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
            <button onClick={() => dispatch(setScreen('dashboard'))} className="hover:text-accent transition-colors">Dashboard</button>
            <ChevronLeft size={10} />
            <span className="text-accent">Shortlist</span>
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Candidates pipeline</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Track your top talent across all active hiring journeys.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-surface border-border font-bold">
            <FileDown size={16} className="mr-2" /> Export CSV
          </Button>
          <Button className="font-bold" onClick={() => dispatch(setScreen('schedule'))}>
            <Calendar size={18} className="mr-2" /> Schedule View
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-6 shadow-sm overflow-x-auto">
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidates..." 
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full no-scrollbar">
          <button 
            onClick={() => setFilterJob('all')}
            className={cn(
              "px-4 py-2 rounded-full text-[11px] font-bold border transition-all shrink-0",
              filterJob === 'all' ? "bg-accent text-white border-accent" : "bg-surface-2 text-text-muted border-border hover:border-accent/40"
            )}
          >
            All Jobs
          </button>
          {jobs.map(j => (
            <button 
              key={j.id}
              onClick={() => setFilterJob(j.id)}
              className={cn(
                "px-4 py-2 rounded-full text-[11px] font-bold border transition-all shrink-0",
                filterJob === j.id ? "bg-accent text-white border-accent" : "bg-surface-2 text-text-muted border-border hover:border-accent/40"
              )}
            >
              {j.title}
            </button>
          ))}
        </div>

        <div className="ml-auto hidden lg:block text-[11px] text-text-muted font-bold uppercase tracking-widest shrink-0">
          {allCandidates.length} Candidates Total
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.length > 0 ? (
          groups.map((group: any) => (
            <ShortlistJobCard key={group.jobId} group={group} />
          ))
        ) : (
          <div className="py-24 text-center bg-surface border border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted opacity-50">
              <Users size={32} />
            </div>
            <h3 className="text-base font-bold text-text-primary">No candidates found</h3>
            <p className="text-sm text-text-muted mt-1">Try adjusting your filters or search query.</p>
            <Button variant="secondary" className="mt-6" onClick={() => { setSearchQuery(''); setFilterJob('all'); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
