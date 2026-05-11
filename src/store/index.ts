import { configureStore } from '@reduxjs/toolkit';
import jobsReducer from './slices/jobsSlice';
import candidatesReducer from './slices/candidatesSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    candidates: candidatesReducer,
    ui: uiReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
