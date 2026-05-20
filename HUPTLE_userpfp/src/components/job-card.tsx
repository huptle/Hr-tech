import Link from "next/link";
import { MapPin, Building2, Clock } from "lucide-react";
import type { PublicJobListing } from "@/server/services/hr-portal.service";
import { Button } from "@/components/ui/button";

type Props = {
  job: PublicJobListing;
  matchScore?: number;
  matchReason?: string;
};

export function JobCard({ job, matchScore, matchReason }: Props) {
  return (
    <article className="rounded-2xl border border-border/50 bg-card/80 p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-lg text-foreground">{job.title}</h3>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            {job.dept ? (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {job.dept}
              </span>
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {job.mode}
            </span>
          </div>
        </div>
        {matchScore != null ? (
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-primary">{matchScore}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              match
            </div>
          </div>
        ) : null}
      </div>

      {matchReason ? (
        <p className="text-sm text-primary/90 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
          {matchReason}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
        {job.description || "No description provided."}
      </p>

      <div className="flex gap-2 pt-1">
        <Button asChild className="flex-1">
          <Link href={`/?job=${job.id}`}>Apply now</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/jobs/${job.id}`}>Details</Link>
        </Button>
      </div>
    </article>
  );
}
