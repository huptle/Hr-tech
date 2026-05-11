'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  Edit, 
  Check, 
  Trash2, 
  ChevronDown, 
  Users, 
  Star, 
  ArrowRight, 
  Eye, 
  Calendar, 
  Sparkles, 
  X, 
  FileDown,
  Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';
import { addJob, updateJob } from '@/store/slices/jobsSlice';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'People & HR', 'Finance', 'Operations', 'Legal', 'Customer Success',
  'Data & Analytics', 'Security', 'Research', 'Academic', 'Medical & Health',
  'Arts & Creative', 'Handyman & Trades', 'Logistics', 'Other',
];

const WORK_MODES = ['Remote', 'On-site', 'Hybrid', 'Not applicable'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'SGD'];

function JobForm({ job, onCancel }: { job?: any, onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    title: job?.title || '',
    dept: job?.dept || 'Engineering',
    mode: job?.mode || 'Remote',
    location: job?.location || 'Remote · Global',
    payMin: '',
    payMax: '',
    currency: 'USD',
    description: job?.description || '',
  });
  const [rewriting, setRewriting] = useState(false);

  const handleRewrite = () => {
    if (!formData.description.trim()) return;
    setRewriting(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        description: `We're hiring a ${prev.title || 'standout candidate'} to join our team.\n\n${prev.description.trim()}\n\nYou'll partner cross-functionally, ship thoughtful work, and help us scale responsibly. We value direct feedback, ownership, and curiosity.`
      }));
      setRewriting(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newJob = {
      id: job?.id || 'j' + Math.random().toString(36).slice(2, 7),
      title: formData.title,
      dept: formData.dept,
      mode: formData.mode,
      location: formData.location,
      applicants: job?.applicants || 0,
      status: job?.status || 'Draft',
      progress: job?.progress || 0,
      description: formData.description,
      posted: new Date().toISOString().slice(0, 10),
    };

    if (job) {
      dispatch(updateJob(newJob as any));
    } else {
      dispatch(addJob(newJob as any));
    }
    onCancel();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-6 shadow-sm max-w-4xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
          {job ? <Edit size={20} /> : <Plus size={20} />}
        </div>
        <h2 className="text-lg font-bold text-text-primary">{job ? 'Edit job' : 'Add new job'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Job title *</label>
          <input 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            placeholder="e.g. Senior DevOps Engineer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Department</label>
            <select 
              value={formData.dept} 
              onChange={e => setFormData({ ...formData, dept: e.target.value })}
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Work Mode</label>
            <select 
              value={formData.mode} 
              onChange={e => setFormData({ ...formData, mode: e.target.value })}
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Location</label>
            <input 
              value={formData.location} 
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
              placeholder="e.g. Remote · EU"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Job description</label>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              className="h-7 text-[10px] font-bold" 
              onClick={handleRewrite}
              disabled={rewriting || !formData.description.trim()}
            >
              {rewriting ? 'Rewriting...' : <><Sparkles size={12} className="mr-1.5" /> AI Rewrite</>}
            </Button>
          </div>
          <textarea 
            rows={6}
            value={formData.description} 
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors resize-none leading-relaxed"
            placeholder="Describe the role, responsibilities, and impact..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" type="button" onClick={onCancel} className="font-bold">Cancel</Button>
          <Button type="submit" className="font-bold min-w-[120px]">
            {job ? 'Update Job' : 'Publish Job'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function CandidateListItem({ candidate, rank }: { candidate: any, rank: number }) {
  const initials = candidate.name.split(' ').map((n: string) => n[0]).join('');
  
  return (
    <div className="grid grid-cols-[40px_1fr_120px_100px_140px] gap-4 items-center px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border/40 last:border-0 group">
      <div className="text-[11px] font-black text-text-muted text-center italic">#{rank}</div>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-text-primary truncate">{candidate.name}</div>
          <div className="text-[10px] text-text-muted font-medium flex items-center gap-2 mt-0.5">
            <span className="font-mono">{candidate.id}</span>
            <span>·</span>
            <span className="truncate">{candidate.location}</span>
          </div>
        </div>
      </div>
      <div className="text-[11px] font-bold text-text-secondary">{candidate.availability}</div>
      <div className="flex justify-center">
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          candidate.score > 85 ? "bg-green-500/15 text-green-500" : 
          candidate.score > 70 ? "bg-accent/15 text-accent" : 
          "bg-amber-500/15 text-amber-500"
        )}>
          {candidate.score}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye size={12} />
        </Button>
        <Button variant="secondary" size="sm" className="h-7 px-3 text-[10px] font-bold">
          Shortlist
        </Button>
      </div>
    </div>
  );
}

function JobCard({ job, onEdit }: { job: any, onEdit: () => void }) {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const candidates = useAppSelector(state => 
    state.candidates.items.filter(c => c.jobId === job.id)
  ).sort((a, b) => b.score - a.score);

  return (
    <motion.div 
      layout
      className={cn(
        "bg-surface border rounded-2xl overflow-hidden transition-all duration-300",
        isExpanded ? "border-accent shadow-xl shadow-accent/5" : "border-border shadow-sm hover:border-border-strong"
      )}
    >
      <div 
        className="p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-bold text-text-primary truncate">{job.title}</h3>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
              job.status === 'Live' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-surface-3 text-text-muted border-border"
            )}>
              {job.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted font-medium">
            <span>{job.dept}</span>
            <span className="opacity-30">|</span>
            <span>{job.location}</span>
            <span className="opacity-30">|</span>
            <span className="text-text-secondary">{job.mode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border rounded-xl">
            <Users size={14} className="text-accent" />
            <span className="text-xs font-bold text-text-primary">{job.applicants}</span>
          </div>
          
          <div className="flex items-center rounded-lg border border-border bg-surface-2 overflow-hidden">
            <button 
              onClick={onEdit}
              className="p-2 hover:bg-surface-3 transition-colors text-text-muted hover:text-text-primary border-r border-border"
              title="Edit job"
            >
              <Edit size={14} />
            </button>
            <button 
              className="p-2 hover:bg-red-500/10 transition-colors text-text-muted hover:text-red-500"
              title="Delete job"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <Button 
            className="h-9 px-4 text-xs font-bold"
            onClick={() => dispatch(setScreen('shortlist'))}
          >
            Leaderboard <ArrowRight size={14} className="ml-2" />
          </Button>

          <button 
            className={cn(
              "p-2 rounded-lg border border-border transition-all duration-300",
              isExpanded ? "bg-accent/10 text-accent border-accent/20" : "bg-surface-2 text-text-muted"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown size={16} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-surface-2/30"
          >
            <div className="px-4 py-2 bg-surface-2 text-[10px] font-bold text-text-muted uppercase tracking-wider grid grid-cols-[40px_1fr_120px_100px_140px] gap-4 border-b border-border">
              <div className="text-center">#</div>
              <div>Candidate</div>
              <div>Availability</div>
              <div className="text-center">Score</div>
              <div className="text-right">Actions</div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/20">
              {candidates.length > 0 ? (
                candidates.map((c, i) => (
                  <CandidateListItem key={c.id} candidate={c} rank={i + 1} />
                ))
              ) : (
                <div className="p-8 text-center text-xs text-text-muted font-medium italic">
                  No applicants yet for this position.
                </div>
              )}
            </div>

            {candidates.length > 0 && (
              <div className="p-3 bg-surface-2/50 flex justify-between items-center border-t border-border">
                <span className="text-[10px] text-text-muted font-bold ml-1">
                  SHOWING {candidates.length} CANDIDATES
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-accent">
                  View full list <ChevronRight size={12} className="ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Jobs() {
  const jobs = useAppSelector(state => state.jobs.items);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.dept.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest">Jobs</div>
          <h1 className="text-3xl font-black text-text-primary mt-1 tracking-tight">Posted roles</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Manage your active listings and evaluate incoming talent.</p>
        </div>
        
        {view === 'list' ? (
          <Button className="font-bold" onClick={() => setView('add')}>
            <Plus size={18} className="mr-2" strokeWidth={3} /> Add new job
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setView('list')} className="font-bold">
            <ChevronLeft size={18} className="mr-2" /> Back to list
          </Button>
        )}
      </div>

      {view !== 'list' ? (
        <JobForm 
          job={selectedJob} 
          onCancel={() => {
            setView('list');
            setSelectedJob(null);
          }} 
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title or department..." 
                className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-2">Sort</span>
              <select className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-secondary outline-none focus:border-accent transition-colors cursor-pointer">
                <option>Newest first</option>
                <option>Most applicants</option>
                <option>Highest budget</option>
              </select>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="text-[10px] text-text-muted font-bold shrink-0">
              {filteredJobs.length} JOBS FOUND
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(j => (
                <JobCard 
                  key={j.id} 
                  job={j} 
                  onEdit={() => {
                    setSelectedJob(j);
                    setView('edit');
                  }} 
                />
              ))
            ) : (
              <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <Search size={32} />
                </div>
                <h3 className="text-base font-bold text-text-primary">No jobs found</h3>
                <p className="text-sm text-text-muted mt-1">Try adjusting your search query or filters.</p>
                <Button variant="secondary" className="mt-6" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight(props: any) {
  return <ChevronRightIcon {...props} />
}

function ChevronRightIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
