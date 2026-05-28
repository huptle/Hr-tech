"use client";

import { motion } from "framer-motion";
import { MapPin, Building2, Clock, Sparkles } from "lucide-react";
import type { PublicJobListing } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";

type Props = {
  job: PublicJobListing;
  matchScore?: number;
  matchReason?: string;
};

export function JobCard({ job, matchScore, matchReason }: Props) {
  return (
    <motion.article
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/45 transition-colors relative overflow-hidden group shadow-sm"
    >
      {/* Decorative accent background on hover */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] font-bold text-muted-foreground">
            {job.dept ? (
              <span className="inline-flex items-center gap-1 bg-accent/40 px-2 py-0.5 rounded-md">
                <Building2 className="w-3 h-3 text-primary/75" />
                {job.dept}
              </span>
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1 bg-accent/40 px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3 text-primary/75" />
                {job.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 bg-accent/40 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-primary/75" />
              {job.mode}
            </span>
          </div>
        </div>

        {/* Fit Score Badge */}
        {matchScore != null ? (
          <div className="text-right shrink-0 bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-1 flex flex-col items-center justify-center">
            <div className="text-lg font-black text-primary leading-none flex items-center gap-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {matchScore}%
            </div>
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-extrabold mt-0.5">
              match
            </div>
          </div>
        ) : null}
      </div>

      {matchReason ? (
        <p className="text-xs font-semibold text-primary/95 bg-primary/5 border border-primary/10 rounded-xl px-3.5 py-2.5 leading-relaxed">
          <strong>Alignment Detail:</strong> {matchReason}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
        {job.description || "No description provided."}
      </p>

      <div className="flex gap-2.5 pt-2 mt-auto border-t border-border/40">
        <LinkButton href={`/?job=${job.id}`} className="flex-1 h-9 font-bold shadow-md shadow-primary/5 active:scale-98">
          Apply Now
        </LinkButton>
        <LinkButton href={`/jobs/${job.id}`} variant="outline" className="h-9 font-bold border-border hover:bg-accent text-foreground active:scale-98">
          Details
        </LinkButton>
      </div>
    </motion.article>
  );
}
