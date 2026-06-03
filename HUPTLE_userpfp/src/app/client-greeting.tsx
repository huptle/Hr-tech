"use client";

import { useEffect, useState } from "react";
import { useCandidateStore } from "@/store/useCandidateStore";

export function ClientGreeting() {
  const { profile } = useCandidateStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-foreground mt-1">
        Find your next role
      </h1>
    );
  }

  if (profile?.name) {
    return (
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-foreground mt-1">
        Welcome back, <span className="text-primary">{profile.name}</span>!
      </h1>
    );
  }

  return (
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-foreground mt-1">
      Find your next role
    </h1>
  );
}
