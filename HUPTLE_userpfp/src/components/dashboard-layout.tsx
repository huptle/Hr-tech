"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Home, Briefcase, Sparkles, UserCircle,
  Bell, LogIn, LogOut, ChevronRight, Settings, Info, ExternalLink
} from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { getSessionEmail, clearSessionEmail } from "@/lib/candidate-session";
import { ThemeToggle } from "./theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, reset, setProfile } = useCandidateStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionEmail, setSessionEmailLocal] = useState<string | null>(null);

  useEffect(() => {
    setSessionEmailLocal(getSessionEmail());
  }, [profile]);

  const signedIn = Boolean(sessionEmail || profile?.email);

  // Sync profile details if email session exists but store is cleared
  useEffect(() => {
    const email = getSessionEmail();
    if (email && !profile) {
      fetch(`/api/profile?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            const row = data.data;
            setProfile({
              name: String(row.name ?? ""),
              email: String(row.email ?? email),
              phone: String(row.phone ?? ""),
              skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
              experience: String(row.experience ?? ""),
              education: String(row.education ?? ""),
              summary: row.summary ? String(row.summary) : undefined,
              resumeUrl: row.resume_url ? String(row.resume_url) : undefined,
              parsed_data: row.parsed_data,
            });
          }
        })
        .catch(() => {});
    }
  }, [profile, setProfile]);

  function signOut() {
    clearSessionEmail();
    reset();
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  // Get initials for profile badge
  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return "G"; // Guest
  };

  const menuItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Browse Jobs", href: "/jobs", icon: Briefcase },
    { name: "AI Matching", href: "/match", icon: Sparkles },
    ...(signedIn
      ? [{ name: "My Profile", href: "/profile", icon: UserCircle }]
      : []),
  ];

  // Helper to determine active route name for breadcrumbs
  const getActivePageName = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/jobs")) return "Jobs";
    if (pathname.startsWith("/match")) return "AI Matcher";
    if (pathname === "/profile") return "My Profile";
    if (pathname === "/account") return "Sign In";
    return "Apply";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 select-none">
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-lg shadow-md shadow-primary/20">
              H
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              Huptle
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
              Apply
            </span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3">
            Candidate Menu
          </div>
          {menuItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10 border-l-4 border-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Premium Promobox Card (Matches Screenshot style) */}
        <div className="px-4 py-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-[#253b6e] to-[#182748] border border-primary/20 text-white relative overflow-hidden shadow-lg shadow-primary/10 group">
            {/* Soft decorative background circles */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/5 blur-xl group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-primary/20 blur-lg" />
            
            <span className="text-[9px] uppercase tracking-widest bg-white/20 text-white px-2 py-0.5 rounded font-black">
              Premium
            </span>
            <h4 className="font-bold text-sm mt-3 leading-tight">
              Scale faster with Huptle AI Agents
            </h4>
            <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
              Automate resume tailoring and instant role matching.
            </p>
            <Link 
              href="/match"
              className="mt-4 w-full h-8 bg-white text-[#182748] hover:bg-slate-100 transition-colors rounded-lg flex items-center justify-center font-bold text-xs shadow-md shadow-black/10 cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-background/50">
          {signedIn ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                  {getInitials()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-foreground truncate">
                    {profile?.name || "Verified User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Candidate
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/account"
              className="w-full h-9 border border-border hover:bg-accent text-foreground transition-colors rounded-lg flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-primary" />
              Sign in to Profile
            </Link>
          )}
        </div>
      </aside>

      {/* Main Dashboard Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 select-none">
          {/* Left section: Hamburger (mobile) + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span>Huptle Apply</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-bold text-sm tracking-tight text-primary">
                {getActivePageName()}
              </span>
            </div>
          </div>

          {/* Right section: Actions, Theme, PFP */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell (Visual match to screenshot) */}
            <button 
              className="relative inline-flex items-center justify-center rounded-full border border-border h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-[1.1rem] w-[1.1rem]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>

            {/* User Profile Avatar / Sign-In Button */}
            {signedIn ? (
              <div className="flex items-center gap-3 pl-2 border-l border-border">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {profile?.name || "Verified Candidate"}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-primary">
                    Candidate
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs border border-primary/20 hover:ring-2 hover:ring-primary/20 hover:scale-105 transition-all shrink-0"
                >
                  {getInitials()}
                </Link>
              </div>
            ) : (
              <Link
                href="/account"
                className="inline-flex h-9 items-center justify-center px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Sidebar Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-50 md:hidden"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden select-none"
              >
                <div className="h-16 px-6 border-b border-border flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-lg">
                      H
                    </div>
                    <span className="font-extrabold text-lg tracking-tight text-foreground">
                      Huptle Apply
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? "text-primary bg-primary/10 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border bg-background/50">
                  {signedIn ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                          {getInitials()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-foreground truncate">
                            {profile?.name || "Verified User"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Candidate
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={signOut}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full h-9 border border-border hover:bg-accent text-foreground transition-colors rounded-lg flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-primary" />
                      Sign in to Profile
                    </Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
