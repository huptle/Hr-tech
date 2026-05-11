'use client';

import React from 'react';
import { useAppSelector } from '@/store';
import { Shell } from '@/components/Shell';
import { Dashboard } from '@/components/screens/Dashboard';
import { Jobs } from '@/components/screens/Jobs';
import { Shortlist } from '@/components/screens/Shortlist';
import { Schedule } from '@/components/screens/Schedule';
import { Templates } from '@/components/screens/Templates';
import { Reports } from '@/components/screens/Reports';
import { Profile } from '@/components/screens/Profile';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const currentScreen = useAppSelector(state => state.ui.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard />;
      case 'jobs': return <Jobs />;
      case 'shortlist': return <Shortlist />;
      case 'schedule': return <Schedule />;
      case 'templates': return <Templates />;
      case 'reports': return <Reports />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <Shell>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}
