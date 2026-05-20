import { create } from 'zustand';
import type { ResumeData } from '@/server/services/resume.types';

interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  summary?: string;
  resumeUrl?: string;
  parsed_data?: ResumeData;
}

interface CandidateStore {
  email: string;
  setEmail: (email: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  isOtpSent: boolean;
  setIsOtpSent: (val: boolean) => void;
  isVerified: boolean;
  setIsVerified: (val: boolean) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  profile: CandidateProfile | null;
  setProfile: (profile: CandidateProfile | null) => void;
  reset: () => void;
}

export const useCandidateStore = create<CandidateStore>((set) => ({
  email: '',
  setEmail: (email) => set({ email }),
  otp: '',
  setOtp: (otp) => set({ otp }),
  isOtpSent: false,
  setIsOtpSent: (isOtpSent) => set({ isOtpSent }),
  isVerified: false,
  setIsVerified: (isVerified) => set({ isVerified }),
  file: null,
  setFile: (file) => set({ file }),
  profile: null,
  setProfile: (profile) => set({ profile }),
  reset: () => set({
    email: '',
    otp: '',
    isOtpSent: false,
    isVerified: false,
    file: null,
    profile: null,
  }),
}));
