import Link from "next/link";
import { Briefcase, Sparkles } from "lucide-react";

export function ApplyPortalHeader() {
  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl rounded-md">
            H
          </div>
          <span className="font-bold text-lg tracking-tight">Huptle Apply</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">All jobs</span>
            <span className="sm:hidden">Jobs</span>
          </Link>
          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Get matched</span>
            <span className="sm:hidden">Match</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
