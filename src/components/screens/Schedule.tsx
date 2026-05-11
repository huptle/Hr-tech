'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  Bot, 
  User, 
  Shield, 
  Send, 
  X, 
  Check, 
  MoreVertical, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  Video,
  ExternalLink,
  Search,
  Mail,
  Loader2
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROUNDS_LIST = [
  'Round 1 — HR Screening',
  'Round 2 — Technical',
  'Round 3 — System Design',
  'Round 4 — Leadership / Panel',
  'Final Round — Culture Fit',
  'Assignment / Take-home',
  'Reference Check',
];

const INTERVIEW_TYPES = [
  { v: 'hr-human', label: 'HR (human)', icon: <User size={12} />, tone: 'neutral' },
  { v: 'hr-ai', label: 'HR (AI Agent)', icon: <Bot size={12} />, tone: 'accent' },
  { v: 'tech-human', label: 'Technical (human)', icon: <User size={12} />, tone: 'neutral' },
  { v: 'tech-ai', label: 'Technical (AI Agent)', icon: <Bot size={12} />, tone: 'accent' },
  { v: 'culture-human', label: 'Culture-fit (human)', icon: <User size={12} />, tone: 'neutral' }
];

const MEET_PROVIDERS = [
  { id: 'meet',  name: 'Google Meet',     icon: <Video size={16} className="text-green-500" /> },
  { id: 'zoom',  name: 'Zoom',            icon: <Video size={16} className="text-blue-500" /> },
  { id: 'teams', name: 'Microsoft Teams', icon: <Video size={16} className="text-indigo-500" /> },
];

function typeMeta(v: string) {
  return INTERVIEW_TYPES.find(t => t.v === v) || INTERVIEW_TYPES[0];
}

function fmtDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function OutcomeModal({ slot, kind, candidates, onClose }: any) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const candidate = candidates.find((c: any) => c.id === slot?.candidate);

  React.useEffect(() => {
    if (!slot) return;
    setLoading(true);
    const firstName = candidate?.name?.split(' ')[0] ?? 'there';
    const templates: any = {
      invite: `Hi ${firstName},\n\nYou're invited to a ${typeMeta(slot.type).label.toLowerCase()} interview for the ${slot.jobTitle} role on ${fmtDateTime(slot.start)} (${slot.duration} min).\n\nPlease confirm at your earliest convenience.\n\n— Huptle HR`,
      reject: `Hi ${firstName},\n\nThank you for your time interviewing for the ${slot.jobTitle} role. After careful review, we won't be moving forward at this time. We truly appreciated your energy.\n\n— Huptle HR`,
      offer: `Hi ${firstName},\n\nWe're thrilled to extend an offer for the ${slot.jobTitle} role. The full offer packet is attached — please review and let us know by Friday.\n\n— Huptle HR`
    };
    const timer = setTimeout(() => {
      setNote(templates[kind] || '');
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [slot, kind, candidate]);

  if (!slot) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-[580px] bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-border bg-surface-2/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Mail size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-text-primary capitalize tracking-tight">{kind} email</h3>
            <p className="text-[11px] text-text-muted font-medium mt-0.5 truncate">To: {candidate?.name} · {candidate?.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-3 flex items-center justify-center text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative">
            <textarea 
              value={loading ? '' : note} 
              onChange={e => setNote(e.target.value)} 
              rows={10}
              className="w-full bg-surface-2 border border-border rounded-2xl p-5 text-sm leading-relaxed text-text-primary outline-none focus:border-accent transition-colors resize-none custom-scrollbar"
              placeholder="Composing..."
            />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-2/50 backdrop-blur-[2px] rounded-2xl">
                <Loader2 size={24} className="text-accent animate-spin mb-3" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">AI Drafting...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="ghost" className="font-bold" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" className="font-bold" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}>Redraft with AI</Button>
            <Button className="font-bold px-8" onClick={onClose}>
              <Send size={16} className="mr-2" /> Send Email
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Schedule() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.jobs.items).filter(j => j.status === 'Live');
  const candidates = useAppSelector(state => state.candidates.items);
  
  const [tab, setTab] = useState<'Scheduling' | 'Overview'>('Scheduling');
  const [outcome, setOutcome] = useState<any>(null);
  const [slots, setSlots] = useState([
    { id: 's1', start: '2026-05-10T10:00', duration: 30, type: 'hr-human', candidate: 'HPTL-C-0042', provider: 'meet', jobId: 'j1', jobTitle: 'Senior DevOps Engineer', round: 'Round 1 — HR Screening' },
    { id: 's2', start: '2026-05-10T14:30', duration: 45, type: 'tech-ai', candidate: 'HPTL-C-0041', provider: 'zoom', jobId: 'j1', jobTitle: 'Senior DevOps Engineer', round: 'Round 2 — Technical' },
    { id: 's3', start: '2026-05-11T09:00', duration: 30, type: 'hr-ai', candidate: null, provider: 'meet', jobId: 'j2', jobTitle: 'Product Designer II', round: 'Round 1 — HR Screening' },
  ]);

  const [newSlot, setNewSlot] = useState({
    jobId: jobs[0]?.id || '',
    start: '',
    duration: '30',
    round: ROUNDS_LIST[0],
    type: 'hr-human',
    provider: 'meet'
  });

  const addSlot = () => {
    if (!newSlot.start || !newSlot.jobId) return;
    const job = jobs.find(j => j.id === newSlot.jobId);
    const slot = {
      id: 's' + Math.random().toString(36).slice(2, 7),
      ...newSlot,
      duration: parseInt(newSlot.duration),
      jobTitle: job?.title || ''
    };
    setSlots(prev => [...prev, slot].sort((a, b) => a.start > b.start ? 1 : -1));
    setNewSlot(prev => ({ ...prev, start: '' }));
  };

  const deleteSlot = (id: string) => setSlots(prev => prev.filter(s => s.id !== id));
  const assignCandidate = (slotId: string, candId: string | null) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, candidate: candId } : s));
  };

  const aiCount = slots.filter(s => s.type.endsWith('-ai')).length;
  const assignedCount = slots.filter(s => s.candidate).length;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex px-8 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-20">
        {['Scheduling', 'Overview'].map((t: any) => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
              tab === t ? "text-accent" : "text-text-muted hover:text-text-primary"
            )}
          >
            {t}
            {tab === t && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
        ))}
      </div>

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">
              <button onClick={() => dispatch(setScreen('dashboard'))} className="hover:text-accent transition-colors">Dashboard</button>
              <ChevronLeft size={10} className="shrink-0" />
              <span className="text-accent">Interview Schedule</span>
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Hiring calendar</h1>
            <p className="text-sm text-text-secondary mt-1 font-medium max-w-xl">Create interview slots, automate AI-led screenings, and manage candidate communications.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="bg-surface border-border font-bold" onClick={() => dispatch(setScreen('shortlist'))}>
              <Users size={16} className="mr-2" /> Pipeline
            </Button>
            <Button className="font-bold">
              <Calendar size={18} className="mr-2" /> Google Calendar Sync
            </Button>
          </div>
        </div>

        {tab === 'Overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total slots</div>
              <div className="text-3xl font-black text-text-primary tracking-tight">{slots.length}</div>
              <div className="text-[11px] text-text-muted font-medium flex items-center gap-1.5"><Check size={12} className="text-green-500" /> {assignedCount} assigned</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">AI Screenings</div>
              <div className="text-3xl font-black text-accent tracking-tight">{aiCount}</div>
              <div className="text-[11px] text-text-muted font-medium flex items-center gap-1.5"><TrendingUp size={12} className="text-accent" /> {Math.round((aiCount/slots.length)*100)}% of total</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Pipeline health</div>
              <div className="text-3xl font-black text-green-500 tracking-tight">Good</div>
              <div className="text-[11px] text-text-muted font-medium flex items-center gap-1.5"><Clock size={12} /> Avg. turnaround 2.4 days</div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Next interview</div>
              <div className="text-lg font-black text-text-primary truncate">{slots[0] ? fmtDateTime(slots[0].start) : 'None'}</div>
              <div className="text-[11px] text-text-muted font-medium flex items-center gap-1.5"><Briefcase size={12} /> {slots[0]?.jobTitle || 'No upcoming'}</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Add Slot Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <h2 className="text-sm font-bold text-text-primary">Create new interview slot</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Job role</label>
                  <select 
                    value={newSlot.jobId} 
                    onChange={e => setNewSlot({ ...newSlot, jobId: e.target.value })}
                    className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={newSlot.start}
                    onChange={e => setNewSlot({ ...newSlot, start: e.target.value })}
                    className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Type</label>
                  <select 
                    value={newSlot.type}
                    onChange={e => setNewSlot({ ...newSlot, type: e.target.value })}
                    className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    {INTERVIEW_TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                </div>
                <Button className="h-[42px] font-bold" onClick={addSlot} disabled={!newSlot.start}>
                  Add Slot
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-6 border-t border-border pt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Meeting platform</label>
                  <div className="flex gap-2">
                    {MEET_PROVIDERS.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setNewSlot({ ...newSlot, provider: p.id })}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold",
                          newSlot.provider === p.id ? "bg-accent/10 border-accent text-accent" : "bg-surface-2 border-border text-text-muted hover:border-border-strong"
                        )}
                      >
                        {p.icon} {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted font-medium italic mt-4">
                  * Meeting links are auto-generated when you send the invite to the candidate.
                </p>
              </div>
            </div>

            {/* Slots List */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-surface/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <h2 className="text-sm font-bold text-text-primary">Available & Scheduled Slots</h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-3 border border-border text-[10px] font-bold text-text-muted ml-1">{slots.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                    <input placeholder="Filter slots..." className="bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-medium outline-none focus:border-accent transition-colors w-40" />
                  </div>
                </div>
              </div>

              <div className="px-6 py-2.5 bg-surface-2 text-[10px] font-bold text-text-muted uppercase tracking-wider grid grid-cols-[1.5fr_1fr_1.2fr_1.3fr_40px] gap-6 border-b border-border">
                <div>Role · Time · Platform</div>
                <div>Interview Type</div>
                <div>Assigned Candidate</div>
                <div className="text-center">Quick actions</div>
                <div />
              </div>

              <div className="divide-y divide-border/30">
                {slots.length > 0 ? (
                  slots.map((s, i) => {
                    const t = typeMeta(s.type);
                    const isAi = s.type.endsWith('-ai');
                    const prov = MEET_PROVIDERS.find(p => p.id === s.provider) || MEET_PROVIDERS[0];
                    const cand = candidates.filter(c => c.jobId === s.jobId);
                    
                    return (
                      <div key={s.id} className="px-6 py-4 grid grid-cols-[1.5fr_1fr_1.2fr_1.3fr_40px] gap-6 items-center hover:bg-surface-2/50 transition-colors group">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[9px] text-accent font-bold px-1.5 py-0.5 bg-accent/10 rounded uppercase">{s.jobId}</span>
                            <span className="text-xs font-bold text-text-primary truncate">{s.jobTitle}</span>
                          </div>
                          <div className="text-[11px] text-text-muted font-medium flex items-center gap-2">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-text-muted/60" /> {fmtDateTime(s.start)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">{prov.icon} {prov.name}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5",
                            t.tone === 'accent' ? "bg-accent/15 text-accent border-accent/20" : "bg-surface-3 text-text-muted border-border"
                          )}>
                            {t.icon} {t.label}
                          </span>
                          {isAi && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                              <Shield size={10} /> Proctored
                            </span>
                          )}
                        </div>

                        <div>
                          <select 
                            value={s.candidate || ''} 
                            onChange={e => assignCandidate(s.id, e.target.value || null)}
                            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                          >
                            <option value="">— Unassigned —</option>
                            {cand.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="flex items-center justify-center gap-1.5">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-3 text-[10px] font-bold disabled:opacity-30"
                            disabled={!s.candidate}
                            onClick={() => setOutcome({ slot: s, kind: 'invite' })}
                          >
                            Invite
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-3 text-[10px] font-bold disabled:opacity-30"
                            disabled={!s.candidate}
                            onClick={() => setOutcome({ slot: s, kind: 'reject' })}
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-3 text-[10px] font-bold text-green-500 disabled:opacity-30"
                            disabled={!s.candidate}
                            onClick={() => setOutcome({ slot: s, kind: 'offer' })}
                          >
                            Offer
                          </Button>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={() => deleteSlot(s.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center text-text-muted font-medium italic">
                    No interview slots created yet.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-surface-2/30 flex items-center justify-between border-t border-border">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  {assignedCount} of {slots.length} slots are currently assigned
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-accent">
                    Clear past slots
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-accent">
                    Export to CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {outcome && (
        <OutcomeModal 
          slot={outcome.slot} 
          kind={outcome.kind} 
          candidates={candidates} 
          onClose={() => setOutcome(null)} 
        />
      )}
    </div>
  );
}

function Trash2(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9 2 2 4-4"/>
    </svg>
  );
}
