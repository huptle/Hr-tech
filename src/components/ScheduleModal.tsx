'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Calendar, 
  Clock, 
  Mail, 
  Users,
  Video,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GoogleG } from './icons';

const ROUNDS_LIST = [
  'Round 1 — HR Screening',
  'Round 2 — Technical',
  'Round 3 — System Design',
  'Round 4 — Leadership / Panel',
  'Final Round — Culture Fit',
  'Assignment / Take-home',
  'Reference Check',
];

const MEET_PROVIDERS = [
  { id: 'meet',  name: 'Google Meet',     icon: <Video size={18} className="text-green-500" /> },
  { id: 'zoom',  name: 'Zoom',            icon: <Video size={18} className="text-blue-500" /> },
  { id: 'teams', name: 'Microsoft Teams', icon: <Video size={18} className="text-indigo-500" /> },
];

function CCInput({ emails, setEmails }: { emails: string[], setEmails: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [val, setVal] = useState('');
  
  const add = () => {
    const trimmed = val.trim();
    if (trimmed && /\S+@\S+\.\S+/.test(trimmed) && !emails.includes(trimmed)) {
      setEmails(prev => [...prev, trimmed]);
    }
    setVal('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 p-2 bg-surface-2 border border-border rounded-xl min-h-[44px] items-center">
        {emails.map(e => (
          <span key={e} className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-[11px] font-bold">
            {e}
            <button onClick={() => setEmails(prev => prev.filter(x => x !== e))} className="hover:text-accent-hover">
              <X size={10} />
            </button>
          </span>
        ))}
        <input 
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={emails.length === 0 ? "Add emails — press Enter or comma to add..." : ""}
          className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted px-2"
        />
      </div>
      <p className="text-[10px] text-text-muted font-medium ml-1 italic">Hiring team members CC'd on the interview invite.</p>
    </div>
  );
}

export function ScheduleModal({ candidate, job, onClose, onNavigate }: any) {
  const [step, setStep] = useState(1);
  const [round, setRound] = useState(ROUNDS_LIST[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [provider, setProvider] = useState('meet');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const firstName = candidate?.name?.split(' ')[0] ?? 'there';
    const providerName = MEET_PROVIDERS.find(p => p.id === provider)?.name;
    setNote(
      `Hi ${firstName},\n\nCongratulations on progressing in your application for the ${job?.title || 'position'}!\n\nWe'd like to invite you to ${round} of our interview process.\n\nDetails:\n• Date: ${date || '[Date TBD]'}\n• Time: ${time || '[Time TBD]'}\n• Duration: ${duration} minutes\n• Format: ${providerName}\n\nPlease confirm your availability at your earliest convenience.\n\nBest regards,\nAjay Gupta\nHR Manager, Huptle`
    );
  }, [candidate, round, provider, date, time, duration, job]);

  const steps = ['Details', 'Email', 'Platform', 'Done'];

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep(4);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-[640px] bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface-2/50 shrink-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-lg">
              {candidate?.name?.split(' ').map((n: any) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-text-primary tracking-tight">Schedule Interview — {candidate?.name}</h2>
              <p className="text-xs text-text-muted font-medium mt-0.5">{candidate?.id} · {job?.title}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-surface-3 flex items-center justify-center text-text-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {steps.map((s, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-300",
                      done ? "bg-green-500 text-white" : active ? "bg-accent text-white ring-4 ring-accent/15" : "bg-surface-3 text-text-muted border border-border"
                    )}>
                      {done ? <Check size={12} strokeWidth={4} /> : num}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      active ? "text-text-primary" : done ? "text-green-500" : "text-text-muted"
                    )}>
                      {s}
                    </span>
                  </div>
                  {num < steps.length && <div className="w-6 h-px bg-border mx-1" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Interview round</label>
                  <select 
                    value={round} 
                    onChange={e => setRound(e.target.value)}
                    className="bg-surface-2 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    {ROUNDS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-surface-2 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-surface-2 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="bg-surface-2 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors cursor-pointer">
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Additional Recipients (CC)</label>
                  <CCInput emails={ccEmails} setEmails={setCcEmails} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-surface-2 border border-border rounded-2xl p-4 flex flex-col gap-2">
                  <div className="text-xs text-text-secondary"><span className="font-bold text-text-muted mr-2">TO:</span> {candidate?.email}</div>
                  {ccEmails.length > 0 && <div className="text-xs text-text-secondary"><span className="font-bold text-text-muted mr-2">CC:</span> {ccEmails.join(', ')}</div>}
                  <div className="text-xs text-text-secondary"><span className="font-bold text-text-muted mr-2">SUBJ:</span> Interview Invite — {round} · {job?.title}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Email body</label>
                  <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    rows={10}
                    className="w-full bg-surface-2 border border-border rounded-2xl p-5 text-sm leading-relaxed text-text-primary outline-none focus:border-accent transition-colors resize-none custom-scrollbar"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="text-sm font-bold text-text-primary ml-1">Select your virtual meeting platform:</div>
                <div className="flex flex-col gap-3">
                  {MEET_PROVIDERS.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setProvider(p.id)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 group",
                        provider === p.id ? "bg-accent/10 border-accent ring-4 ring-accent/5" : "bg-surface-2 border-border hover:border-accent/40"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                        {p.icon}
                      </div>
                      <span className="text-base font-bold text-text-primary flex-1 text-left">{p.name}</span>
                      {provider === p.id && <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Check size={14} strokeWidth={4} /></div>}
                    </button>
                  ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4">
                  <div className="text-amber-500 shrink-0 mt-0.5"><Clock size={18} /></div>
                  <div className="text-[13px] text-text-secondary leading-relaxed font-medium">
                    A <span className="font-bold text-text-primary">{MEET_PROVIDERS.find(p => p.id === provider)?.name}</span> link will be auto-generated and included in the calendar invite.
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center text-center py-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-500/5">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">Interview scheduled!</h2>
                <p className="text-sm text-text-secondary mt-3 max-w-xs leading-relaxed font-medium">
                  The <span className="font-bold text-text-primary">{round}</span> invite has been sent to <span className="font-bold text-text-primary">{candidate?.name}</span>.
                </p>
                
                <div className="bg-surface-2 border border-border rounded-2xl p-5 mt-8 w-full max-w-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-text-primary">
                    <Calendar size={16} className="text-accent" /> {date || 'Date TBD'} at {time}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-text-primary">
                    <Video size={16} className="text-accent" /> {MEET_PROVIDERS.find(p => p.id === provider)?.name}
                  </div>
                  {ccEmails.length > 0 && (
                    <div className="flex items-center gap-3 text-xs font-medium text-text-muted border-t border-border pt-3 mt-1">
                      <Users size={14} /> CC'd: {ccEmails.length} recipients
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-10 w-full max-w-xs">
                  <Button variant="secondary" className="flex-1 font-bold h-12" onClick={() => { onClose(); onNavigate?.('schedule'); }}>View Calendar</Button>
                  <Button className="flex-1 font-bold h-12" onClick={onClose}>Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="p-6 border-t border-border bg-surface-2/50 flex justify-between shrink-0">
            <Button variant="ghost" className="font-bold" onClick={step > 1 ? () => setStep(s => s - 1) : onClose}>
              {step > 1 ? <><ChevronLeft size={18} className="mr-2" /> Back</> : 'Cancel'}
            </Button>
            <div className="flex gap-3">
              {step < 3 ? (
                <Button className="font-bold px-8 h-12" onClick={() => setStep(s => s + 1)}>
                  {step === 1 ? 'Compose email' : 'Select platform'} <ChevronRight size={18} className="ml-2" />
                </Button>
              ) : (
                <Button className="font-bold px-8 h-12" onClick={handleSend} disabled={sending}>
                  {sending ? <><Loader2 size={18} className="mr-2 animate-spin" /> Sending...</> : <><Send size={18} className="mr-2" /> Send invite</>}
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
