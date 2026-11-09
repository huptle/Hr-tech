"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, Sparkles, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceOrbProps {
  state: VoiceOrbState;
  onClick?: () => void;
  audioLevel?: number; // 0 to 1
  className?: string;
}

export function VoiceOrb({
  state,
  onClick,
  audioLevel = 0.5,
  className,
}: VoiceOrbProps) {
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center cursor-pointer select-none group",
        className,
      )}
      onClick={onClick}
    >
      {/* Outer ambient pulsing aura */}
      <motion.div
        animate={
          isListening
            ? {
                scale: [1, 1.35 + audioLevel * 0.4, 1.15],
                opacity: [0.35, 0.7, 0.4],
              }
            : isSpeaking
              ? {
                  scale: [1.1, 1.45, 1.2],
                  opacity: [0.4, 0.8, 0.5],
                }
              : isThinking
                ? {
                    rotate: 360,
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }
                : {
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.35, 0.2],
                  }
        }
        transition={{
          repeat: Infinity,
          duration: isListening ? 1.8 : isSpeaking ? 1.2 : isThinking ? 2.5 : 3.5,
          ease: "easeInOut",
        }}
        className={cn(
          "absolute -inset-10 rounded-full blur-3xl pointer-events-none transition-colors duration-500",
          isListening && "bg-gradient-to-tr from-emerald-500/40 via-teal-400/30 to-blue-500/30",
          isSpeaking && "bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 to-pink-500/30",
          isThinking && "bg-gradient-to-tr from-amber-400/40 via-orange-500/30 to-indigo-500/30",
          state === "idle" && "bg-accent/25",
        )}
      />

      {/* Secondary ripple waves for active voice */}
      {(isListening || isSpeaking) && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.8 + audioLevel * 0.5, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeOut",
            }}
            className={cn(
              "absolute inset-0 rounded-full border-2 pointer-events-none",
              isListening ? "border-emerald-400/60" : "border-indigo-400/60",
            )}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 2.2 + audioLevel * 0.6, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: 0.6,
              ease: "easeOut",
            }}
            className={cn(
              "absolute inset-0 rounded-full border pointer-events-none",
              isListening ? "border-teal-400/40" : "border-purple-400/40",
            )}
          />
        </>
      )}

      {/* Main interactive sphere */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={
          isSpeaking
            ? {
                scale: [1, 1.08, 0.98, 1.05, 1],
              }
            : isListening
              ? {
                  scale: [1, 1.04 + audioLevel * 0.1, 1],
                }
              : {}
        }
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
        className={cn(
          "w-32 h-32 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center relative shadow-2xl z-10 transition-all duration-500",
          isListening &&
            "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-emerald-500/40 ring-4 ring-emerald-400/30",
          isSpeaking &&
            "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-indigo-500/50 ring-4 ring-purple-400/40",
          isThinking &&
            "bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 shadow-amber-500/40 ring-4 ring-amber-400/30",
          state === "idle" &&
            "bg-gradient-to-br from-blue-600 via-indigo-600 to-accent shadow-accent/40 ring-4 ring-accent/20 group-hover:ring-accent/40",
        )}
      >
        {/* Core Icon */}
        <div className="text-white flex flex-col items-center justify-center gap-1.5">
          {isThinking ? (
            <Loader2 className="w-9 h-9 animate-spin text-white drop-shadow" />
          ) : isSpeaking ? (
            <Volume2 className="w-9 h-9 animate-pulse text-white drop-shadow" />
          ) : isListening ? (
            <Mic className="w-9 h-9 text-white drop-shadow animate-bounce" />
          ) : (
            <Sparkles className="w-9 h-9 text-white drop-shadow group-hover:scale-110 transition-transform" />
          )}

          <span className="text-[11px] font-black tracking-widest uppercase text-white/90 drop-shadow-sm">
            {isListening
              ? "Listening..."
              : isThinking
                ? "Thinking..."
                : isSpeaking
                  ? "Speaking..."
                  : "Tap to Speak"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

