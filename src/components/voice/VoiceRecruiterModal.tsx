"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Briefcase,
  Users,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { VoiceOrb } from "./VoiceOrb";
import { LivePersonaCanvas } from "./LivePersonaCanvas";
import {
  CandidatePersona,
  ConversationMessage,
  INITIAL_PERSONA,
  VoiceTurnResponse,
} from "@/lib/voice-persona-types";
import {
  processVoiceTurn,
  createJobFromPersona,
  searchTalentPoolForPersona,
} from "@/app/actions/voice-recruiter";
import Link from "next/link";

interface VoiceRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (err: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface IWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

type MatchedCandidate = {
  id: string;
  name: string;
  skills: string;
  experienceYears: number;
  location: string;
  matchScore: number;
  broker?: {
    agencyName: string;
    brokerCode: string;
  };
};

export function VoiceRecruiterModal({ isOpen, onClose }: VoiceRecruiterModalProps) {
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [persona, setPersona] = useState<CandidatePersona>(INITIAL_PERSONA);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [manualText, setManualText] = useState<string>("");
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
    "I need a B2B sales guy",
    "Full-stack engineer chahiye",
    "Hiring a Senior Growth Marketer",
  ]);
  const [isCreatingJob, setIsCreatingJob] = useState<boolean>(false);
  const [createdJobInfo, setCreatedJobInfo] = useState<{ id: string; title: string } | null>(null);
  const [matchedCandidates, setMatchedCandidates] = useState<MatchedCandidate[]>([]);
  const [isSearchingTalent, setIsSearchingTalent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const handleUserMessageRef = useRef<(text: string) => Promise<void>>(async () => {});

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ConversationMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLiveTranscript(text);
    setManualText("");
    setVoiceState("thinking");

    try {
      const response: VoiceTurnResponse = await processVoiceTurn(
        text,
        newHistory,
        persona,
      );

      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: response.assistantSpeech,
        timestamp: Date.now(),
      };

      setMessages([...newHistory, assistantMsg]);
      setPersona(response.updatedPersona);
      if (response.suggestedReplies?.length) {
        setSuggestedReplies(response.suggestedReplies);
      }

      speakText(response.assistantSpeech);
    } catch (err) {
      console.error("Failed to process turn:", err);
      setVoiceState("idle");
    }
  };

  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  });

  // Initialize Speech Synthesis & Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const win = window as unknown as IWindow;
      const SpeechRecognitionConstructor =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN"; // Handles Indian English & Hinglish well

        recognition.onstart = () => {
          setVoiceState("listening");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const text = final || interim;
          setLiveTranscript(text);

          if (final.trim()) {
            handleUserMessageRef.current(final.trim());
          }
        };

        recognition.onerror = (err: unknown) => {
          console.warn("Speech recognition error:", err);
          setVoiceState("idle");
        };

        recognition.onend = () => {
          setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Stop audio on close
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      setVoiceState("idle");
    }
  }, [isOpen]);

  const speakText = (text: string) => {
    if (!audioEnabled || typeof window === "undefined" || !synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes("en-IN") ||
        v.name.includes("Google") ||
        v.name.includes("Natural"),
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setVoiceState("speaking");
    };

    utterance.onend = () => {
      setVoiceState("idle");
    };

    utterance.onerror = () => {
      setVoiceState("idle");
    };

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (voiceState === "listening") {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      setVoiceState("idle");
      return;
    }

    if (recognitionRef.current) {
      try {
        setLiveTranscript("");
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start failed:", err);
      }
    } else {
      alert("Speech recognition is not supported in this browser. You can type below!");
    }
  };

  const handleCreateJob = async () => {
    if (!persona.roleTitle && !persona.archetype) return;
    setIsCreatingJob(true);
    try {
      const res = await createJobFromPersona(persona);
      if (res.ok) {
        setCreatedJobInfo({ id: res.jobId, title: res.title });
      }
    } catch (err) {
      console.error("Create job failed:", err);
      alert("Failed to create job. Please ensure you are logged in.");
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleSearchTalent = async () => {
    setIsSearchingTalent(true);
    try {
      const res = await searchTalentPoolForPersona(persona);
      setMatchedCandidates(res.candidates || []);
    } catch (err) {
      console.error("Search talent failed:", err);
    } finally {
      setIsSearchingTalent(false);
    }
  };

  const handleCopyPersona = () => {
    const summaryText = `## Ideal Candidate Persona: ${persona.archetype || persona.roleTitle}
- **Role:** ${persona.roleTitle}
- **Experience:** ${persona.experienceRange}
- **Budget:** ${persona.budget?.fixed || "Market standard"}
- **Work Mode:** ${persona.workMode} (${persona.location})

### Psychological DNA
${persona.psychologicalDna.map((t) => `- ${t}`).join("\n")}

### Team & Culture Dynamics
${persona.teamCultureFit.map((t) => `- ${t}`).join("\n")}

### Green Flags
${persona.greenFlags.map((t) => `✓ ${t}`).join("\n")}

### Red Flags / Dealbreakers
${persona.redFlags.map((t) => `✗ ${t}`).join("\n")}
`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (synthRef.current) synthRef.current.cancel();
    setPersona(INITIAL_PERSONA);
    setMessages([]);
    setLiveTranscript("");
    setCreatedJobInfo(null);
    setMatchedCandidates([]);
    setVoiceState("idle");
    setSuggestedReplies([
      "I need a B2B sales guy",
      "Full-stack engineer chahiye",
      "Hiring a Senior Growth Marketer",
    ]);
  };

  if (!isOpen) return null;

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-surface border border-border/80 w-full max-w-6xl h-[92vh] max-h-[820px] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-border/60 flex items-center justify-between bg-surface/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-accent/25">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Huptle Voice Recruiter
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 uppercase tracking-widest">
                  AI Voice Mode
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 uppercase tracking-widest hidden sm:inline-block">
                  Hinglish & English
                </span>
              </div>
              <p className="text-[11px] text-text-muted font-medium">
                Consultative AI Agent building your Ideal Candidate Persona in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioEnabled && synthRef.current) synthRef.current.cancel();
                setAudioEnabled(!audioEnabled);
              }}
              title={audioEnabled ? "Mute Voice Output" : "Enable Voice Output"}
              className="p-2 rounded-xl border border-border bg-surface-2 text-text-muted hover:text-text-primary hover:border-accent transition-colors"
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={handleReset}
              title="Reset Conversation"
              className="p-2 rounded-xl border border-border bg-surface-2 text-text-muted hover:text-text-primary hover:border-accent transition-colors"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-border bg-surface-2 text-text-muted hover:text-text-primary hover:border-rose-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body - Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Voice Orb & Interactive Dialogue */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 border-b lg:border-b-0 lg:border-r border-border/60 bg-gradient-to-b from-surface to-surface-2/40 overflow-y-auto custom-scrollbar">
            {/* Top Prompt / Last Assistant Spoken Response */}
            <div className="min-h-[70px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={lastAssistantMessage || "initial"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="p-4 rounded-2xl bg-surface-2/80 border border-border/70 text-center w-full"
                >
                  <p className="text-xs md:text-sm font-bold text-text-primary leading-relaxed">
                    &ldquo;{lastAssistantMessage || "Hey! What role or persona are you looking to hire today? Speak naturally in English or Hinglish."}&rdquo;
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Central Animated Voice Orb */}
            <div className="my-auto py-8 flex flex-col items-center justify-center gap-4">
              <VoiceOrb state={voiceState} onClick={startListening} />

              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                  {voiceState === "listening"
                    ? "Listening to you... speak now"
                    : voiceState === "thinking"
                      ? "Analyzing & updating persona..."
                      : voiceState === "speaking"
                        ? "Huptle is speaking..."
                        : "Click the orb or speak to start"}
                </span>

                {/* Live Speech Subtitle */}
                {liveTranscript && (
                  <p className="text-xs text-text-primary font-medium max-w-sm text-center italic bg-surface-3/50 px-3 py-1 rounded-lg border border-border/50">
                    &ldquo;{liveTranscript}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Bottom: Quick Suggestions & Manual Input */}
            <div className="flex flex-col gap-3">
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {suggestedReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserMessage(reply)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-surface-2 border border-border hover:border-accent hover:text-accent text-text-muted transition-all active:scale-95"
                  >
                    💬 {reply}
                  </button>
                ))}
              </div>

              {/* Text Input Fallback */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualText.trim()) handleUserMessage(manualText);
                }}
                className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border focus-within:border-accent transition-colors"
              >
                <input
                  type="text"
                  placeholder="Or type here in English / Hinglish..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim() || voiceState === "thinking"}
                  className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Candidate Persona Canvas & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 overflow-y-auto custom-scrollbar bg-background/50">
            {/* Live Persona Canvas */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <LivePersonaCanvas persona={persona} />

              {/* Matched Candidates Preview (if searched) */}
              <AnimatePresence>
                {matchedCandidates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="mt-4 p-4 rounded-3xl bg-surface border border-border flex flex-col gap-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-accent" />
                        <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                          Matched Candidates from Talent Pool ({matchedCandidates.length})
                        </span>
                      </div>
                      <Link
                        href="/broker/candidates"
                        className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
                      >
                        View Full Pool <ExternalLink size={11} />
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                      {matchedCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3 rounded-2xl bg-surface-2 border border-border/70 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-text-primary">{cand.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-black text-[10px]">
                                {cand.matchScore}% Fit
                              </span>
                            </div>
                            <div className="text-[11px] text-text-muted mt-0.5">
                              {cand.experienceYears} Yrs Exp · {cand.skills || "Relevant background"} · {cand.location || "Remote"}
                            </div>
                          </div>
                          {cand.broker?.brokerCode && (
                            <span className="text-[10px] font-mono text-accent font-bold px-2 py-1 rounded-lg bg-accent/10">
                              {cand.broker.brokerCode}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Banner if Job Created */}
              <AnimatePresence>
                {createdJobInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-400"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      <div>
                        <div className="text-xs font-black text-text-primary">
                          Job Posting Created Successfully!
                        </div>
                        <div className="text-[11px] text-text-muted">
                          &ldquo;{createdJobInfo.title}&rdquo; is now live with voice screening questions.
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/jobs"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 hover:bg-emerald-600 transition-colors shadow-md"
                    >
                      Open Job <ChevronRight size={13} />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 mt-4 shrink-0">
              <button
                onClick={handleCopyPersona}
                disabled={!persona.roleTitle && !persona.archetype}
                className="px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 hover:border-accent text-text-muted hover:text-text-primary text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? "Copied Brief!" : "Copy Persona Brief"}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSearchTalent}
                  disabled={isSearchingTalent || (!persona.roleTitle && !persona.archetype)}
                  className="px-4 py-2.5 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-black flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <Users size={14} />
                  <span>{isSearchingTalent ? "Matching..." : "Match Talent Pool"}</span>
                </button>

                <button
                  onClick={handleCreateJob}
                  disabled={isCreatingJob || (!persona.roleTitle && !persona.archetype)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:opacity-90 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-40"
                >
                  <Briefcase size={14} />
                  <span>{isCreatingJob ? "Creating Live Job..." : "⚡ Create Live Job"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
