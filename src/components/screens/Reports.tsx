'use client';

import React from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Share2
} from 'lucide-react';
import { Button } from '../ui/button';
import { HBarChart, LineChart } from '../Charts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function MetricCard({ label, value, delta, deltaPositive = true, trendData, icon: Icon }: any) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent/40 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon size={20} />
        </div>
        {delta && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
            deltaPositive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
          )}>
            {deltaPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta}
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</div>
        <div className="text-3xl font-black text-text-primary tracking-tight">{value}</div>
      </div>
      {trendData && (
        <div className="h-12 w-full mt-2 opacity-50">
          <LineChart data={trendData} height={50} color={deltaPositive ? '#10b981' : '#ef4444'} />
        </div>
      )}
    </div>
  );
}

export function Reports() {
  const hiringFunnel = [
    { label: 'Applied', value: 450, color: '#3f64ba' },
    { label: 'Screened', value: 180, color: '#4f74ca' },
    { label: 'Interview', value: 95, color: '#5f84da' },
    { label: 'Shortlist', value: 42, color: '#6f94ea' },
    { label: 'Offer', value: 12, color: '#7fa4fa' },
    { label: 'Hired', value: 8, color: '#10b981' }
  ];

  const timeToHireData = [
    { label: 'W1', value: 24 }, { label: 'W2', value: 22 }, { label: 'W3', value: 25 },
    { label: 'W4', value: 20 }, { label: 'W5', value: 18 }, { label: 'W6', value: 19 }
  ];

  const sourceData = [
    { label: 'LinkedIn', value: 240 },
    { label: 'Referral', value: 110 },
    { label: 'Direct', value: 65 },
    { label: 'Indeed', value: 35 }
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest">Analytics</div>
          <h1 className="text-3xl font-black text-text-primary mt-1 tracking-tight">Hiring Intelligence</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Deep dive into your hiring funnel, sourcing efficiency, and team performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-surface border-border font-bold">
            <Filter size={16} className="mr-2" /> Filter Range
          </Button>
          <Button className="font-bold">
            <Download size={16} className="mr-2" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Conversion Rate" value="12.4%" delta="+2.1%" icon={TrendingUp} trendData={timeToHireData} />
        <MetricCard label="Avg. Time to Hire" value="18 days" delta="-3 days" deltaPositive={true} icon={Clock} trendData={timeToHireData.reverse()} />
        <MetricCard label="Cost per Hire" value="$4,200" delta="+$150" deltaPositive={false} icon={BarChart3} />
        <MetricCard label="Candidate NPS" value="4.8/5" delta="+0.2" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-primary tracking-tight">Hiring Funnel</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Global distribution</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-accent text-white text-[10px] font-bold uppercase tracking-widest">Funnel View</button>
              <button className="px-3 py-1 rounded-lg bg-surface-2 text-text-muted text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent transition-colors">Cohort View</button>
            </div>
          </div>
          <HBarChart data={hiringFunnel} maxVal={450} unit="" />
          <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Total Applicants</span>
              <span className="text-xl font-black text-text-primary tracking-tight">2,482</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Drop-off Rate</span>
              <span className="text-xl font-black text-red-500 tracking-tight">64%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Efficiency</span>
              <span className="text-xl font-black text-green-500 tracking-tight">88%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-primary tracking-tight">Sourcing Channels</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Top performing sources</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {sourceData.map((s, i) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary">{s.label}</span>
                    <span className="text-xs font-black text-text-muted">{s.value}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.value / 240) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-accent rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl shadow-accent/20">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none -translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform duration-700">
              <BarChart3 size={240} />
            </div>
            <h3 className="text-xl font-black tracking-tight relative z-10">AI Insights</h3>
            <p className="text-sm text-white/80 mt-2 leading-relaxed relative z-10 font-medium">
              "Your time-to-hire for Engineering roles has decreased by 14% since implementing AI Screening Agents. Recommend increasing AI-led rounds for Marketing."
            </p>
            <Button variant="secondary" className="mt-6 bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold backdrop-blur-sm relative z-10">
              Detailed AI Report <Share2 size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
