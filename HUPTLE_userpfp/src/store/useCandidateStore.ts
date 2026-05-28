import { create } from 'zustand';
import type { ResumeData } from '@/server/services/resume.types';
import type { JobRecommendation } from '@/server/services/hr-portal.service';

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
  isVerified: boolean;
  setIsVerified: (val: boolean) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  profile: CandidateProfile | null;
  setProfile: (profile: CandidateProfile | null) => void;
  recommendations: JobRecommendation[];
  setRecommendations: (items: JobRecommendation[]) => void;
  reset: () => void;
}

export const useCandidateStore = create<CandidateStore>((set) => ({
  email: '',
  setEmail: (email) => set({ email }),
  isVerified: false,
  setIsVerified: (isVerified) => set({ isVerified }),
  file: null,
  setFile: (file) => set({ file }),
  profile: null,
  setProfile: (profile) => set({ profile }),
  recommendations: [],
  setRecommendations: (recommendations) => set({ recommendations }),
  reset: () => set({
    email: '',
    isVerified: false,
    file: null,
    profile: null,
    recommendations: [],
  }),
}));
