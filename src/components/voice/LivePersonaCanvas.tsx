"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Brain,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Banknote,
  Briefcase,
  MapPin,
  Sparkles,
} from "lucide-react";
import { CandidatePersona } from "@/lib/voice-persona-types";
import { cn } from "@/lib/utils";

interface LivePersonaCanvasProps {
  persona: CandidatePersona;
  className?: string;
}

export function LivePersonaCanvas({ persona, className }: LivePersonaCanvasProps) {
  const hasBasicInfo = Boolean(
    persona.roleTitle || persona.archetype || persona.experienceRange || persona.budget?.fixed,
  );
  const hasPsychology = Boolean(persona.psychologicalDna?.length);
  const hasCulture = Boolean(persona.teamCultureFit?.length);
  const hasFlags = Boolean(persona.greenFlags?.length || persona.redFlags?.length);
  const hasQuestions = Boolean(persona.suggestedScreeningQuestions?.length);

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-3xl p-5 flex flex-col gap-4 overflow-hidden relative shadow-xl backdrop-blur-md custom-scrollbar",
        className,
      )}
    >
      {/* Header & Completeness */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">
              Live Candidate Persona
            </h3>
            <p className="text-sm font-extrabold text-text-primary">
              {persona.archetype || (persona.roleTitle ? `${persona.roleTitle} Persona` : "Building Persona...")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              Readiness
            </span>
            <div className="text-xs font-black text-accent">{persona.completenessScore}%</div>
          </div>
          <div className="w-12 h-2 rounded-full bg-surface-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${persona.completenessScore}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={cn(
                "h-full rounded-full",
                persona.completenessScore >= 75
                  ? "bg-emerald-500"
                  : persona.completenessScore >= 40
                    ? "bg-accent"
                    : "bg-amber-500",
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar text-xs">
        {/* Basic Role & Target Highlights */}
        {hasBasicInfo ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-surface-2 border border-border/80 flex flex-col gap-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              {persona.roleTitle && (
                <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent font-black text-xs flex items-center gap-1.5">
                  <Briefcase size={12} /> {persona.roleTitle}
                </span>
              )}
              {persona.experienceRange && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-3 border border-border text-text-primary font-bold text-xs">
                  ⏳ {persona.experienceRange}
                </span>
              )}
              {persona.budget?.fixed && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs flex items-center gap-1">
                  <Banknote size={12} /> {persona.budget.fixed}
                  {persona.budget.variable ? ` (+ ${persona.budget.variable})` : ""}
                </span>
              )}
              {(persona.workMode || persona.location) && (
                <span className="px-2.5 py-1 rounded-lg bg-surface-3 border border-border text-text-muted font-bold text-xs flex items-center gap-1">
                  <MapPin size={12} /> {persona.workMode || "Remote"}
                  {persona.location ? ` · ${persona.location}` : ""}
                </span>
              )}
            </div>

            {persona.summary && (
              <p className="text-text-muted leading-relaxed text-[11px] font-medium pt-1 border-t border-border/40">
                {persona.summary}
              </p>
            )}
          </motion.div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-1.5 text-text-muted py-6">
            <Sparkles size={20} className="text-accent/60 animate-pulse" />
            <p className="font-bold text-text-primary text-xs">Start speaking to craft your Persona</p>
            <p className="text-[11px]">Say: &ldquo;I need a sales guy, find me someone&rdquo; or any role you want to fill.</p>
          </div>
        )}

        {/* Psychological DNA ("Kaisa human chahiye") */}
        <AnimatePresence>
          {hasPsychology && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-muted">
                <Brain size={14} className="text-indigo-400" />
                <span>Psychological DNA & Mindset</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {persona.psychologicalDna.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[11px]"
                  >
                    ✦ {trait}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team & Culture Fit Dynamics */}
        <AnimatePresence>
          {hasCulture && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-muted">
                <Users size={14} className="text-teal-400" />
                <span>Team & Culture Compatibility</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {persona.teamCultureFit.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-[11px]"
                  >
                    ● {trait}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Green Flags vs Red Flags */}
        <AnimatePresence>
          {hasFlags && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
            >
              {/* Green Flags */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                  <CheckCircle2 size={13} />
                  <span>Green Flags (Hire Signals)</span>
                </div>
                <div className="flex flex-col gap-1 text-[11px] text-text-muted">
                  {persona.greenFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags / Dealbreakers */}
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-500">
                  <XCircle size={13} />
                  <span>Dealbreakers & Red Flags</span>
                </div>
                <div className="flex flex-col gap-1 text-[11px] text-text-muted">
                  {persona.redFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-black">✗</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Screening Questions Preview */}
        <AnimatePresence>
          {hasQuestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 pt-2 border-t border-border/60"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-muted">
                <HelpCircle size={14} className="text-accent" />
                <span>Tailored Voice Screening Questions</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {persona.suggestedScreeningQuestions.slice(0, 3).map((q, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface-2 border border-border/60 text-[11px] text-text-primary font-medium flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{q}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
