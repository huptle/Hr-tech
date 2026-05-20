"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { JobCard } from "@/components/job-card";
import { useCandidateStore } from "@/store/useCandidateStore";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ApplyPortalHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-12 flex-1">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Recommended for you</h1>
          <p className="text-muted-foreground mt-2">
            {profile?.name
              ? `Based on ${profile.name}'s resume — ranked by fit with open roles.`
              : "Ranked by fit with open roles."}
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              No recommendations returned. Browse all jobs instead.
            </p>
            <Button asChild>
              <Link href="/jobs">View all jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => {
              const job = jobById.get(rec.jobId);
              if (!job) {
                return (
                  <article
                    key={rec.jobId}
                    className="rounded-2xl border border-border p-5"
                  >
                    <h3 className="font-bold">{rec.title}</h3>
                    <p className="text-sm text-primary mt-2">{rec.matchScore}% match</p>
                    <p className="text-sm text-muted-foreground mt-2">{rec.reason}</p>
                    <Button asChild className="mt-4">
                      <Link href={`/?job=${rec.jobId}`}>Apply</Link>
                    </Button>
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

        <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link href="/jobs">See all open jobs</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
