'use client';

import React, { ComponentType, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  Users,
  Calendar,
  Mail,
  FileText,
  Bell,
  LogOut,
  Settings,
  Sparkles,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { ThemeToggle } from './theme-toggle';
import { HuptleWordmark } from './icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type CurrentUser = {
  name: string;
  role: string;
  initials: string;
};

function SideNavItem({
  icon: Icon,
  label,
  href,
  active,
  badge,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>,
  label: string,
  href?: string,
  active?: boolean,
  badge?: string,
  onClick?: () => void,
}) {
  const cls = cn(
    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-bold relative",
    active
      ? "bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20"
      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
  );

  const inner = (
    <>
      <Icon size={18} className={cn("transition-colors duration-300", active ? "text-accent" : "text-text-muted group-hover:text-text-primary")} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
          active ? "bg-accent text-white" : "bg-surface-3 text-text-muted border border-border"
        )}>
          {badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeSideNav"
          className="absolute -left-1 top-2 bottom-2 w-1 bg-accent rounded-full"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} type="button">
      {inner}
    </button>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  const pathname = usePathname() ?? '/';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const breadcrumb =
    pathname === '/' ? 'Analytics' :
    pathname.startsWith('/jobs') ? 'Jobs' :
    pathname.startsWith('/schedule') ? 'Interviews / Schedule' :
    pathname.startsWith('/shortlist') ? 'Interviews / Pipeline' :
    pathname.startsWith('/templates') ? 'Templates' :
    pathname.startsWith('/reports') ? 'Reports' :
    pathname.startsWith('/profile') ? 'Profile' :
    'Overview';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-surface border-r border-border flex flex-col shrink-0 overflow-hidden z-40 fixed lg:relative w-[260px] lg:w-[240px]"
          >
            <div className="p-4 flex flex-col gap-1 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex items-center justify-between mb-6 px-2 lg:hidden">
                <HuptleWordmark height={24} className="text-text-primary" />
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-surface-2 rounded-xl text-text-muted">
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-3 mb-3 opacity-50">Main Menu</div>
              <SideNavItem icon={Home} label="Analytics" href="/" active={isActive(pathname, '/')} />
              <SideNavItem icon={Briefcase} label="Jobs" href="/jobs" active={isActive(pathname, '/jobs')} />
              <SideNavItem icon={Users} label="Pipeline" href="/shortlist" active={isActive(pathname, '/shortlist')} />
              <SideNavItem icon={Calendar} label="Schedule" href="/schedule" active={isActive(pathname, '/schedule')} />
              <SideNavItem icon={Mail} label="Templates" href="/templates" active={isActive(pathname, '/templates')} />
              <SideNavItem icon={FileText} label="Reports" href="/reports" active={isActive(pathname, '/reports')} />

              <div className="mt-auto pt-6 flex flex-col gap-1 border-t border-border/50">
                <div className="mx-1 mb-6 p-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-accent relative overflow-hidden group">
                  <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 group-hover:scale-125 transition-transform duration-700">
                    <Sparkles size={100} />
                  </div>
                  <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 relative z-10">Premium</div>
                  <div className="text-xs font-bold text-white leading-tight relative z-10">Scale faster with Huptle AI Agents</div>
                  <button className="mt-4 w-full py-2.5 rounded-xl bg-white text-accent text-[11px] font-black flex items-center justify-center gap-2 shadow-xl hover:bg-white/90 transition-all relative z-10">
                    <Sparkles size={12} /> Get Started
                  </button>
                </div>
                <SideNavItem icon={Settings} label="Settings" href="/profile" active={isActive(pathname, '/profile')} />
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-bold relative text-text-muted hover:text-text-primary hover:bg-surface-2"
                  >
                    <LogOut size={18} className="text-text-muted group-hover:text-text-primary transition-colors" />
                    <span className="flex-1 text-left">Sign out</span>
                  </button>
                </form>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 bg-surface border-b border-border flex items-center px-4 lg:px-6 gap-4 lg:gap-6 shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-text-primary transition-colors"
            type="button"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="hover:opacity-80 transition-opacity hidden lg:block">
              <HuptleWordmark height={24} className="text-text-primary" />
            </Link>
            <span className="text-[10px] font-black bg-accent text-white px-1.5 py-0.5 rounded tracking-widest hidden sm:block">AI</span>
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <div className="flex items-center text-xs gap-1 font-medium">
              <Link href="/" className="text-text-muted hover:text-accent transition-colors">Huptle</Link>
              <span className="text-text-muted opacity-30">/</span>
              <span className="text-text-primary font-bold truncate max-w-[120px] lg:max-w-[200px]">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <button
              className="w-9 h-9 rounded-xl border border-border bg-surface-2 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent transition-colors relative"
              type="button"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            <Link
              href="/profile"
              className="flex items-center gap-3 pl-1 pr-1 lg:pr-3 py-1 rounded-full border border-border bg-surface-2 cursor-pointer hover:border-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-accent flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-accent/20 ring-2 ring-accent/10">
                {user.initials || '??'}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-[11px] font-black text-text-primary leading-none tracking-tight">{user.name}</span>
                <span className="text-[9px] font-bold text-text-muted mt-1 leading-none uppercase tracking-widest">{user.role}</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background/50 relative custom-scrollbar">
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
