import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Candidate {
  jobId: string;
  jobTitle: string;
  id: string;
  name: string;
  email: string;
  location: string;
  availability: string;
  score: number;
  journey: string;
}

interface CandidatesState {
  items: Candidate[];
  loading: boolean;
  error: string | null;
}

const initialState: CandidatesState = {
  items: [
    { jobId: 'j1', jobTitle: 'Senior DevOps Engineer',        id: 'HPTL-C-0041', name: 'Priya Menon',       email: 'priya.menon@example.com',  location: 'Berlin, DE',       availability: 'Immediate', score: 92, journey: 'Round 1' },
    { jobId: 'j1', jobTitle: 'Senior DevOps Engineer',        id: 'HPTL-C-0042', name: 'Jordan Reyes',      email: 'jreyes@example.com',       location: 'Remote · EU',   availability: '2 weeks',   score: 88, journey: 'Shortlisted' },
    { jobId: 'j1', jobTitle: 'Senior DevOps Engineer',        id: 'HPTL-C-0043', name: 'Kenji Watanabe',    email: 'kenji.w@example.com',      location: 'Tokyo, JP',        availability: '1 month',   score: 85, journey: 'Shortlisted' },
    { jobId: 'j1', jobTitle: 'Senior DevOps Engineer',        id: 'HPTL-C-0044', name: 'Sarah Lindqvist',   email: 's.lindqvist@example.com',  location: 'Stockholm, SE',    availability: 'Immediate', score: 81, journey: 'Rejected' },
    { jobId: 'j1', jobTitle: 'Senior DevOps Engineer',        id: 'HPTL-C-0045', name: 'Diego Alvarez',     email: 'd.alvarez@example.com',    location: 'Madrid, ES',       availability: '3 weeks',   score: 76, journey: 'Round 1' },
    { jobId: 'j2', jobTitle: 'Product Designer II',           id: 'HPTL-C-0051', name: 'Mei Tanaka',        email: 'mei.tanaka@example.com',   location: 'Singapore',        availability: 'Immediate', score: 91, journey: 'Round 2' },
    { jobId: 'j2', jobTitle: 'Product Designer II',           id: 'HPTL-C-0052', name: 'Sarah Lindqvist',   email: 's.lindqvist@example.com',  location: 'Stockholm, SE',    availability: 'Immediate', score: 80, journey: 'Offer Sent' },
    { jobId: 'j2', jobTitle: 'Product Designer II',           id: 'HPTL-C-0053', name: 'Luca Ferrari',      email: 'luca.f@example.com',       location: 'Milan, IT',        availability: '2 weeks',   score: 77, journey: 'Shortlisted' },
    { jobId: 'j3', jobTitle: 'Data Analyst',                  id: 'HPTL-C-0061', name: 'Diego Alvarez',     email: 'd.alvarez2@example.com',   location: 'Madrid, ES',       availability: '3 weeks',   score: 78, journey: 'Round 1' },
    { jobId: 'j3', jobTitle: 'Data Analyst',                  id: 'HPTL-C-0062', name: 'Amara Nwosu',       email: 'amara.n@example.com',      location: 'Lagos, NG',        availability: 'Immediate', score: 74, journey: 'Shortlisted' },
    { jobId: 'j4', jobTitle: 'Engineering Manager, Platform', id: 'HPTL-C-0071', name: 'Aisha Nkosi',      email: 'a.nkosi@example.com',      location: 'Nairobi, KE',      availability: '1 month',   score: 94, journey: 'Offer Accepted' },
    { jobId: 'j4', jobTitle: 'Engineering Manager, Platform', id: 'HPTL-C-0072', name: 'Ravi Shankar',      email: 'ravi.s@example.com',       location: 'Bengaluru, IN',    availability: '2 weeks',   score: 89, journey: 'Round 2' },
    { jobId: 'j5', jobTitle: 'HR Generalist',                 id: 'HPTL-C-0081', name: 'Fatima Al-Rashid',  email: 'fatima.ar@example.com',    location: 'Dubai, AE',        availability: 'Immediate', score: 83, journey: 'Shortlisted' },
  ],
  loading: false,
  error: null,
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.items = action.payload;
    },
    updateCandidateJourney: (state, action: PayloadAction<{ id: string; journey: string }>) => {
      const cand = state.items.find(c => c.id === action.payload.id);
      if (cand) {
        cand.journey = action.payload.journey;
      }
    },
  },
});

export const { setCandidates, updateCandidateJourney } = candidatesSlice.actions;
export default candidatesSlice.reducer;
