"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  AlertCircle,
  Square,
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
  processAudioVoiceTurn,
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
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
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
  const [audioLevel, setAudioLevel] = useState<number>(0.4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const speakText = useCallback((text: string) => {
    if (!audioEnabled || typeof window === "undefined" || !synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

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
  }, [audioEnabled]);

  const handleUserMessage = useCallback(async (text: string) => {
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
  }, [messages, persona, speakText]);

  // Clean up audio tracks & speech engines
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      setVoiceState("idle");
      setLiveTranscript("");
      setErrorMessage(null);
    }
  }, [isOpen, cleanupAudio]);

  const stopListeningAndProcess = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    const currentFinalText = liveTranscript.trim();

    // 1. If Web Speech gave a valid transcript, process directly
    if (currentFinalText) {
      await handleUserMessage(currentFinalText);
      return;
    }

    // 2. If Web Speech had no text (e.g. on HTTP or unsupported browser), send recorded audio to Gemini
    if (audioChunksRef.current.length > 0) {
      setVoiceState("thinking");
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0].type || "audio/webm",
        });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const rawResult = reader.result as string;
          const base64Data = rawResult ? rawResult.split(",")[1] : "";
          if (!base64Data) {
            setVoiceState("idle");
            return;
          }

          try {
            const res = await processAudioVoiceTurn(
              base64Data,
              audioBlob.type || "audio/webm",
              messages,
              persona,
            );

            const userSpokenText = res.transcribedText || "Spoken Voice Input";
            const userMsg: ConversationMessage = {
              role: "user",
              content: userSpokenText,
              timestamp: Date.now(),
            };

            const assistantMsg: ConversationMessage = {
              role: "assistant",
              content: res.assistantSpeech,
              timestamp: Date.now(),
            };

            setLiveTranscript(userSpokenText);
            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            setPersona(res.updatedPersona);
            if (res.suggestedReplies?.length) {
              setSuggestedReplies(res.suggestedReplies);
            }
            speakText(res.assistantSpeech);
          } catch (audioErr) {
            console.error("Audio processing failed:", audioErr);
            setVoiceState("idle");
          }
        };
      } catch {
        setVoiceState("idle");
      }
      return;
    }

    setVoiceState("idle");
  }, [liveTranscript, handleUserMessage, messages, persona, speakText]);

  const startListening = async () => {
    if (synthRef.current) synthRef.current.cancel();
    setErrorMessage(null);

    // If currently listening, clicking again stops and processes
    if (voiceState === "listening") {
      await stopListeningAndProcess();
      return;
    }

    setVoiceState("listening");
    setLiveTranscript("");

    // Step 1: Capture microphone audio stream
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        // Visualizer with AudioContext
        try {
          const win = window as unknown as IWindow;
          const AudioContextConstructor = window.AudioContext || win.webkitAudioContext;
          if (AudioContextConstructor) {
            const ctx = new AudioContextConstructor();
            audioContextRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!audioStreamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(1, Math.max(0.15, avg / 70)));
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch {
          /* ignore analyser errors */
        }

        // Universal MediaRecorder setup
        if (typeof MediaRecorder !== "undefined") {
          audioChunksRef.current = [];
          const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
              ? "audio/webm"
              : MediaRecorder.isTypeSupported("audio/mp4")
                ? "audio/mp4"
                : "";

          const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
        }
      }
    } catch (micErr: unknown) {
      console.warn("Microphone access error:", micErr);
      const isSecure =
        typeof window !== "undefined" &&
        (window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      if (!isSecure) {
        setErrorMessage(
          "Notice: Chrome blocks microphone permissions on plain HTTP connections. Please use HTTPS or localhost, or use the text box & quick chips below.",
        );
      } else {
        setErrorMessage(
          "Microphone permission was not granted. Please check your browser's microphone permissions in the URL address bar.",
        );
      }
      setVoiceState("idle");
      return;
    }

    // Step 2: Also attempt browser Web Speech API for low-latency live subtitles
    try {
      const win = window as unknown as IWindow;
      const SpeechRecognitionConstructor =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

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
          if (text.trim()) {
            setLiveTranscript(text);
          }
        };

        recognition.onerror = (err: unknown) => {
          console.warn("Speech recognition warning:", err);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (recErr) {
      console.warn("SpeechRecognition start error:", recErr);
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
    cleanupAudio();
    setPersona(INITIAL_PERSONA);
    setMessages([]);
    setLiveTranscript("");
    setErrorMessage(null);
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
            <div className="my-auto py-6 flex flex-col items-center justify-center gap-3">
              <VoiceOrb state={voiceState} audioLevel={audioLevel} onClick={startListening} />

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                  {voiceState === "listening"
                    ? "Listening... speak now"
                    : voiceState === "thinking"
                      ? "Analyzing & updating persona..."
                      : voiceState === "speaking"
                        ? "Huptle is speaking..."
                        : "Click the orb or speak to start"}
                </span>

                {/* Stop & Submit Pill when listening */}
                {voiceState === "listening" && (
                  <button
                    type="button"
                    onClick={stopListeningAndProcess}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-black hover:bg-rose-500/25 transition-all cursor-pointer shadow-sm animate-pulse"
                  >
                    <Square size={10} className="fill-current" />
                    <span>Done Speaking (Tap to Process)</span>
                  </button>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2 max-w-sm text-left mt-1">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                    <span className="leading-tight">{errorMessage}</span>
                  </div>
                )}

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
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-surface-2 border border-border hover:border-accent hover:text-accent text-text-muted transition-all active:scale-95 cursor-pointer"
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
                  className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
                className="px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 hover:border-accent text-text-muted hover:text-text-primary text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? "Copied Brief!" : "Copy Persona Brief"}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSearchTalent}
                  disabled={isSearchingTalent || (!persona.roleTitle && !persona.archetype)}
                  className="px-4 py-2.5 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-black flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Users size={14} />
                  <span>{isSearchingTalent ? "Matching..." : "Match Talent Pool"}</span>
                </button>

                <button
                  onClick={handleCreateJob}
                  disabled={isCreatingJob || (!persona.roleTitle && !persona.archetype)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:opacity-90 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-40 cursor-pointer"
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
