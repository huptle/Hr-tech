import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Job {
  id: string;
  title: string;
  dept: string;
  location: string;
  applicants: number;
  status: 'Live' | 'Draft' | 'Screening';
  progress?: number;
}

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  items: [
    { id: 'j1', title: 'Senior DevOps Engineer',       dept: 'Engineering', location: 'Remote · EU',     applicants: 48, status: 'Live', progress: 62 },
    { id: 'j2', title: 'Product Designer II',           dept: 'Design',      location: 'London, UK',      applicants: 36, status: 'Live', progress: 40 },
    { id: 'j3', title: 'Data Analyst',                  dept: 'Analytics',   location: 'Bengaluru, IN',   applicants: 91, status: 'Live', progress: 25 },
    { id: 'j4', title: 'Engineering Manager, Platform', dept: 'Engineering', location: 'Remote · Global', applicants: 24, status: 'Live', progress: 75 },
    { id: 'j5', title: 'HR Generalist',                 dept: 'People',      location: 'New York, US',    applicants: 15, status: 'Draft', progress: 8 },
  ],
  loading: false,
  error: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.items = action.payload;
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.items.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.items.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const { setJobs, addJob, updateJob } = jobsSlice.actions;
export default jobsSlice.reducer;
