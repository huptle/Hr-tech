import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  currentScreen: 'dashboard' | 'jobs' | 'schedule' | 'shortlist' | 'templates' | 'reports' | 'profile';
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  currentScreen: 'dashboard',
  isSidebarOpen: true,
  theme: 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setScreen: (state, action: PayloadAction<UIState['currentScreen']>) => {
      state.currentScreen = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
  },
});

export const { setScreen, toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
