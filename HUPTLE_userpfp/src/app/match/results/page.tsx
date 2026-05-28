"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { JobCard } from "@/components/job-card";
import { useCandidateStore } from "@/store/useCandidateStore";
import { LinkButton } from "@/components/link-button";
import type { PublicJobListing } from "@/server/services/hr-portal.service";

export default function MatchResultsPage() {
  const router = useRouter();
  const { recommendations, profile } = useCandidateStore();
  const [allJobs, setAllJobs] = useState<PublicJobListing[]>([]);

  useEffect(() => {
    if (!profile && recommendations.length === 0) {
      router.replace("/match");
    }
  }, [profile, recommendations.length, router]);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (d.jobs) setAllJobs(d.jobs);
      })
      .catch(() => {});
  }, []);

  const jobById = useMemo(() => new Map(allJobs.map((j) => [j.id, j])), [allJobs]);

  if (!profile && recommendations.length === 0) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-10 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Match Recommendations
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-3">
            Recommended for You
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.name
              ? `Based on ${profile.name}'s resume — ranked by fit with our open roles.`
              : "Ranked by fit with open roles."}
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl space-y-4">
            <p className="text-sm text-muted-foreground">
              No recommendations returned. Browse all jobs instead.
            </p>
            <LinkButton href="/jobs" className="h-10">
              View All Jobs
            </LinkButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => {
              const job = jobById.get(rec.jobId);
              if (!job) {
                return (
                  <article
                    key={rec.jobId}
                    className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{rec.title}</h3>
                      <div className="text-2xl font-black text-primary mt-2">{rec.matchScore}% match</div>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">{rec.reason}</p>
                    <LinkButton href={`/?job=${rec.jobId}`} className="h-9 w-full">
                      Apply Now
                    </LinkButton>
                  </article>
                );
              }
              return (
                <JobCard
                  key={rec.jobId}
                  job={job}
                  matchScore={rec.matchScore}
                  matchReason={rec.reason}
                />
              );
            })}
          </div>
        )}

        <div className="pt-6 text-center border-t border-border/60">
          <LinkButton href="/jobs" variant="outline" className="h-10 hover:bg-accent border-border">
            See All Open Jobs
          </LinkButton>
        </div>
      </div>
    </DashboardLayout>
  );
}
