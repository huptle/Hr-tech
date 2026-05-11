'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Edit, 
  LogOut, 
  AlertTriangle, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Phone,
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setScreen } from '@/store/slices/uiSlice';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Ajay Gupta',
    email: user?.email || 'ajay.gupta@huptle.ai',
    designation: user?.role || 'HR Manager',
    company: 'Huptle AI',
    phone: '+91 98765 43210'
  });
  const [deactivateStep, setDeactivateStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-accent uppercase tracking-widest">Account Settings</div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Your profile</h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">Manage your personal information, security, and account preferences.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-surface-2/30 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl ring-8 ring-accent/5">
              {formData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-text-muted hover:text-accent transition-colors">
              <Edit size={14} />
            </button>
          </div>
          <h2 className="text-xl font-black text-text-primary mt-4 tracking-tight">{formData.name}</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">{formData.designation} · {formData.company}</p>
        </div>

        <div className="p-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Full Name</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Email Address</label>
                    <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Designation</label>
                    <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Company</label>
                    <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Phone Number</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
                  <Button variant="ghost" className="font-bold" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button className="font-bold min-w-[140px]" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</> : <><Check size={16} className="mr-2" /> Save changes</>}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-0 divide-y divide-border/40"
              >
                {[
                  { label: 'Name', value: formData.name, icon: User },
                  { label: 'Email', value: formData.email, icon: Mail },
                  { label: 'Designation', value: formData.designation, icon: Briefcase },
                  { label: 'Company', value: formData.company, icon: Building2 },
                  { label: 'Phone', value: formData.phone, icon: Phone }
                ].map((item, i) => (
                  <div key={item.label} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
                        <item.icon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{item.label}</span>
                        <span className="text-sm font-bold text-text-primary mt-0.5">{item.value}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                ))}

                <div className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Plan</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-text-primary">Enterprise AI Agent</span>
                        <span className="bg-amber-500/15 text-amber-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20">Active</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 font-bold">Manage</Button>
                </div>

                <div className="pt-8 pb-2">
                  <Button className="w-full font-bold h-12 shadow-md shadow-accent/10" onClick={() => setEditing(true)}>
                    <Edit size={16} className="mr-2" /> Edit profile details
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-base font-black text-red-500 tracking-tight">Danger Zone</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed font-medium">
          Deactivating your account will immediately revoke access to all hiring data. You can reactivate within 30 days. After that, all data will be permanently purged.
        </p>
        <Button variant="danger" className="w-fit font-bold mt-2" onClick={() => setDeactivateStep(1)}>
          Deactivate account
        </Button>
      </div>

      <div className="flex justify-center pb-12">
        <Button variant="ghost" className="text-text-muted hover:text-red-500 font-bold">
          <LogOut size={16} className="mr-2" /> Sign out of Huptle
        </Button>
      </div>

      {/* Deactivate Dialog */}
      <AnimatePresence>
        {deactivateStep > 0 && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl text-center"
            >
              {deactivateStep === 1 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-xl font-black text-text-primary tracking-tight">Are you absolutely sure?</h2>
                  <p className="text-sm text-text-muted mt-4 leading-relaxed font-medium">
                    This action will suspend your access and begin the 30-day deletion countdown.
                  </p>
                  <div className="flex flex-col gap-3 mt-8">
                    <Button variant="danger" className="h-12 font-bold" onClick={() => setDeactivateStep(2)}>Yes, deactivate my account</Button>
                    <Button variant="ghost" className="h-12 font-bold" onClick={() => setDeactivateStep(0)}>Keep my account</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                    <Check size={32} />
                  </div>
                  <h2 className="text-xl font-black text-text-primary tracking-tight">Deactivation initiated</h2>
                  <p className="text-sm text-text-muted mt-4 leading-relaxed font-medium">
                    Your account has been deactivated. You have 30 days to log back in before permanent deletion.
                  </p>
                  <Button className="w-full h-12 font-bold mt-8" onClick={() => dispatch(setScreen('dashboard'))}>Return to dashboard</Button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[500]"
          >
            <Check size={18} strokeWidth={4} />
            <span className="text-sm font-bold">Profile updated successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
