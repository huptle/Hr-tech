'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Home, Briefcase, Calendar, Star, Mail, TrendingUp, User, ArrowRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';

const SEARCH_PAGES = [
  { type: 'page', label: 'Overview / Dashboard', screen: 'dashboard', icon: Home },
  { type: 'page', label: 'Jobs — Posted roles', screen: 'jobs', icon: Briefcase },
  { type: 'page', label: 'Interview Schedule', screen: 'schedule', icon: Calendar },
  { type: 'page', label: 'Shortlisted Candidates', screen: 'shortlist', icon: Star },
  { type: 'page', label: 'Email Templates', screen: 'templates', icon: Mail },
  { type: 'page', label: 'Reports & Analytics', screen: 'reports', icon: TrendingUp },
] as const;

export function GlobalSearch() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.jobs.items);
  const candidates = useAppSelector(state => state.candidates.items);
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: any[] = [];
    
    SEARCH_PAGES.forEach((p) => {
      if (p.label.toLowerCase().includes(q)) out.push({ ...p });
    });
    
    jobs.forEach((j) => {
      if (j.title.toLowerCase().includes(q) || j.id.toLowerCase().includes(q) || j.dept?.toLowerCase().includes(q)) {
        out.push({ type: 'job', label: j.title, sub: `${j.id} · ${j.dept} · ${j.status}`, screen: 'jobs', icon: Briefcase });
      }
    });
    
    candidates.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.jobTitle?.toLowerCase().includes(q)) {
        out.push({ type: 'candidate', label: c.name, sub: `${c.id} · ${c.jobTitle} · ${c.journey}`, screen: 'shortlist', icon: User });
      }
    });
    
    return out.slice(0, 8);
  }, [query, jobs, candidates]);

  const toneFor = (type: string) => {
    switch (type) {
      case 'page': return 'text-accent';
      case 'job': return 'text-green-500';
      case 'candidate': return 'text-amber-500';
      default: return 'text-text-muted';
    }
  };

  const labelFor = (type: string) => {
    switch (type) {
      case 'page': return 'Page';
      case 'job': return 'Job';
      case 'candidate': return 'Candidate';
      default: return type;
    }
  };

  const onNavigate = (screen: any) => {
    dispatch(setScreen(screen));
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <div 
        onClick={() => setOpen(true)} 
        className="w-full max-w-[380px] h-[34px] bg-surface border border-border rounded-xl flex items-center px-3 gap-2 text-text-muted text-xs cursor-text transition-colors hover:border-accent/40 group"
      >
        <Search size={14} className="group-hover:text-accent transition-colors" />
        <span className="flex-1">Search candidates, jobs, interviews…</span>
        <span className="text-[10px] px-1.5 py-0.5 border border-border rounded bg-surface-2 font-mono">⌘K</span>
      </div>

      {open && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[500] flex items-start justify-center pt-[120px]" 
          onClick={() => { setOpen(false); setQuery(''); }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-[560px] bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={18} className="text-accent shrink-0" />
              <input 
                ref={inputRef}
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search candidates, jobs, pages…" 
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
                onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-surface-2 rounded-md text-text-muted">
                  <X size={14} />
                </button>
              )}
              <kbd className="text-[10px] px-1.5 py-0.5 border border-border rounded bg-surface-2 text-text-muted">esc</kbd>
            </div>

            <div className="max-h-[360px] overflow-auto py-2">
              {results.length > 0 ? (
                results.map((r, i) => (
                  <div 
                    key={i} 
                    onClick={() => onNavigate(r.screen)} 
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-2 transition-colors border-b border-border/10 last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 ${toneFor(r.type)}`}>
                      <r.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary">{r.label}</div>
                      {r.sub && <div className="text-[11px] text-text-muted truncate">{r.sub}</div>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 border border-current/20 ${toneFor(r.type)}`}>
                      {labelFor(r.type)}
                    </span>
                    <ArrowRight size={13} className="text-text-muted" />
                  </div>
                ))
              ) : query ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  No results for "<span className="text-text-primary font-medium">{query}</span>"
                </div>
              ) : (
                <div className="px-4 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Quick navigation</div>
                  {SEARCH_PAGES.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => onNavigate(p.screen)} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-text-primary text-sm font-medium hover:bg-surface-2 transition-colors"
                    >
                      <p.icon size={15} className="text-accent" />
                      {p.label}
                      <ArrowRight size={12} className="ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
