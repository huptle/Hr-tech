'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Mail, 
  FileCode, 
  Layout, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Edit, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Interview', 'Offer', 'Rejection', 'Onboarding'];

const SEED_TEMPLATES = [
  { id: 't1', title: 'Round 1 — HR Screening', type: 'Email', category: 'Interview', updated: '2 days ago', body: 'Hi [Candidate Name], we would like to invite you to...' },
  { id: 't2', title: 'Technical Assessment Invite', type: 'Email', category: 'Interview', updated: '1 week ago', body: 'Hello [Candidate Name], please find the instructions for...' },
  { id: 't3', title: 'Senior Software Engineer JD', type: 'Job Description', category: 'Other', updated: '3 days ago', body: 'We are looking for a Senior Software Engineer to join our...' },
  { id: 't4', title: 'Standard Offer Letter', type: 'Document', category: 'Offer', updated: '5 days ago', body: 'Dear [Candidate Name], we are pleased to offer you the position of...' },
  { id: 't5', title: 'Post-interview Rejection', type: 'Email', category: 'Rejection', updated: '1 day ago', body: 'Hi [Candidate Name], thank you for your time interviewing with us...' },
];

function TemplateCard({ template }: { template: any }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/40 transition-all group relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
          {template.type === 'Email' ? <Mail size={18} /> : template.type === 'Job Description' ? <FileCode size={18} /> : <FileText size={18} />}
        </div>
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-text-muted transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 p-1 overflow-hidden"
                >
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                    <Edit size={14} className="text-text-muted" /> Edit template
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                    <Copy size={14} className="text-text-muted" /> Duplicate
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <h3 className="text-sm font-black text-text-primary mb-1 truncate">{template.title}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{template.type}</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span className="text-[10px] font-bold text-accent">{template.category}</span>
      </div>

      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-6 font-medium">
        {template.body}
      </p>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-[10px] text-text-muted font-medium">Updated {template.updated}</span>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-accent px-2">
          Use Template <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export function Templates() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = SEED_TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest">Library</div>
          <h1 className="text-3xl font-black text-text-primary mt-1 tracking-tight">Templates</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Standardize your communications and documents across the organization.</p>
        </div>
        <Button className="font-bold">
          <Plus size={18} className="mr-2" strokeWidth={3} /> Create Template
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-3xl p-4 flex flex-col lg:flex-row items-center gap-6 shadow-sm overflow-x-auto">
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..." 
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full no-scrollbar">
          {CATEGORIES.map(c => (
            <button 
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "px-4 py-2 rounded-full text-[11px] font-bold border transition-all shrink-0 uppercase tracking-widest",
                activeCategory === c ? "bg-accent text-white border-accent" : "bg-surface-2 text-text-muted border-border hover:border-accent/40"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="ml-auto hidden lg:flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/10 rounded-xl">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">AI-Driven generation</span>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(t => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-surface border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted opacity-50">
            <Layout size={32} />
          </div>
          <h3 className="text-base font-bold text-text-primary">No templates found</h3>
          <p className="text-sm text-text-muted mt-1">Try adjusting your filters or search query.</p>
          <Button variant="secondary" className="mt-6" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* AI Template Studio CTA */}
      <div className="mt-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-accent rounded-[32px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-accent/20">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none -translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform duration-1000">
          <Sparkles size={400} />
        </div>
        <div className="max-w-2xl relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
            <Sparkles size={24} />
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">Generate custom templates with Huptle AI</h2>
          <p className="text-lg text-white/80 mt-4 leading-relaxed font-medium">
            Just describe the scenario, and our AI will draft a context-aware template for you. Perfectly tailored to your company voice and culture.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Button className="bg-white text-accent hover:bg-white/90 font-black h-14 px-8 text-lg rounded-2xl shadow-xl">
              Launch AI Studio <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-14 px-8 rounded-2xl">
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
