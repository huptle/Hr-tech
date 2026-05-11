'use client';

import React from 'react';
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
  ChevronRight,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen, toggleSidebar } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './theme-toggle';
import { HuptleWordmark } from './icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function SideNavItem({ 
  icon: Icon, 
  label, 
  active, 
  badge, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  badge?: string, 
  onClick?: () => void 
}) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-bold relative",
        active 
          ? "bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20" 
          : "text-text-muted hover:text-text-primary hover:bg-surface-2"
      )}
    >
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
    </button>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { currentScreen, isSidebarOpen } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);
  
  const breadcrumb = {
    dashboard: 'Analytics', 
    jobs: 'Jobs', 
    schedule: 'Interviews / Schedule',
    shortlist: 'Interviews / Pipeline', 
    templates: 'Templates', 
    reports: 'Reports',
    profile: 'Profile'
  }[currentScreen] || 'Overview';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
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
                <button onClick={() => dispatch(toggleSidebar())} className="p-2 hover:bg-surface-2 rounded-xl text-text-muted">
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-3 mb-3 opacity-50">Main Menu</div>
              <SideNavItem icon={Home} label="Analytics" active={currentScreen === 'dashboard'} onClick={() => dispatch(setScreen('dashboard'))} />
              <SideNavItem icon={Briefcase} label="Jobs" active={currentScreen === 'jobs'} onClick={() => dispatch(setScreen('jobs'))} badge="12" />
              <SideNavItem icon={Users} label="Pipeline" active={currentScreen === 'shortlist'} onClick={() => dispatch(setScreen('shortlist'))} badge="248" />
              <SideNavItem icon={Calendar} label="Schedule" active={currentScreen === 'schedule'} onClick={() => dispatch(setScreen('schedule'))} />
              <SideNavItem icon={Mail} label="Templates" active={currentScreen === 'templates'} onClick={() => dispatch(setScreen('templates'))} />
              <SideNavItem icon={FileText} label="Reports" active={currentScreen === 'reports'} onClick={() => dispatch(setScreen('reports'))} />

              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-3 mt-8 mb-3 opacity-50">Recent Focus</div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => dispatch(setScreen('schedule'))}
                className="mx-1 p-4 rounded-2xl bg-surface-2 border border-border cursor-pointer hover:border-accent/40 transition-all group"
              >
                <div className="text-xs font-black text-text-primary group-hover:text-accent transition-colors">Senior DevOps Engineer</div>
                <div className="text-[10px] text-text-muted mt-1.5 font-medium">48 candidates · 6 stages</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-surface bg-accent/20 flex items-center justify-center text-[8px] font-black text-accent">P{i}</div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-accent ml-auto group-hover:translate-x-1 transition-transform">Schedule →</span>
                </div>
              </motion.div>

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
                <SideNavItem icon={Settings} label="Settings" active={currentScreen === 'profile'} onClick={() => dispatch(setScreen('profile'))} />
                <SideNavItem icon={LogOut} label="Sign out" onClick={() => dispatch(logout())} />
                <div className="text-[10px] text-text-muted px-3 py-4 mt-2 opacity-30 font-medium">v1.24.0-pro · build_8f3a2</div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Nav */}
        <header className="h-16 bg-surface border-b border-border flex items-center px-4 lg:px-6 gap-4 lg:gap-6 shrink-0 z-30">
          <button 
            onClick={() => dispatch(toggleSidebar())} 
            className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-text-primary transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => dispatch(setScreen('dashboard'))}
              className="hover:opacity-80 transition-opacity hidden lg:block"
            >
              <HuptleWordmark height={24} className="text-text-primary" />
            </button>
            <span className="text-[10px] font-black bg-accent text-white px-1.5 py-0.5 rounded tracking-widest hidden sm:block">AI</span>
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <div className="flex items-center text-xs gap-1 font-medium">
              <span className="text-text-muted hover:text-accent transition-colors cursor-pointer" onClick={() => dispatch(setScreen('dashboard'))}>Huptle</span>
              <span className="text-text-muted opacity-30">/</span>
              <span className="text-text-primary font-bold truncate max-w-[120px] lg:max-w-[200px]">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex-1 flex justify-center max-w-md mx-auto">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <button className="w-9 h-9 rounded-xl border border-border bg-surface-2 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            <div 
              onClick={() => dispatch(setScreen('profile'))}
              className="flex items-center gap-3 pl-1 pr-1 lg:pr-3 py-1 rounded-full border border-border bg-surface-2 cursor-pointer hover:border-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-accent flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-accent/20 ring-2 ring-accent/10">
                {user?.initials || '??'}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-[11px] font-black text-text-primary leading-none tracking-tight">{user?.name}</span>
                <span className="text-[9px] font-bold text-text-muted mt-1 leading-none uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background/50 relative custom-scrollbar">
          {/* Subtle Grain Overlay */}
          <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
