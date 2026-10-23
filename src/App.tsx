/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SwimDataProvider, useSwimData } from './context/SwimDataContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AthletesView } from './components/AthletesView';
import { EventsView } from './components/EventsView';
import { SeedingView } from './components/SeedingView';
import { TimekeeperView } from './components/TimekeeperView';
import { ResultsView } from './components/ResultsView';
import { OfficialMinutesView } from './components/OfficialMinutesView';
import { PublicBoardView } from './components/PublicBoardView';
import { SettingsView } from './components/SettingsView';
import { EntryListView } from './components/EntryListView';
import { NomorListView } from './components/NomorListView';
import { BukuAcaraView } from './components/BukuAcaraView';
import { PrintModal } from './components/PrintModal';

const MainContent: React.FC = () => {
  const { activeTab, championship } = useSwimData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'athletes' && <AthletesView />}
        {activeTab === 'events' && <EventsView />}
        {activeTab === 'entry_list' && <EntryListView />}
        {activeTab === 'nomor_list' && <NomorListView />}
        {activeTab === 'seeding' && <SeedingView />}
        {activeTab === 'timekeeper' && <TimekeeperView />}
        {activeTab === 'results' && <ResultsView />}
        {activeTab === 'buku_acara' && <BukuAcaraView />}
        {activeTab === 'scoreboard' && <PublicBoardView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'minutes' && <OfficialMinutesView />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SwimRace Manager v1.0</span>
            <span aria-hidden="true">·</span>
            <span>Standar World Aquatics & PB Akuatik Indonesia</span>
          </div>
          <div className="text-center sm:text-right text-slate-400">
            {championship.venue} · {championship.poolLength} Pool ({championship.poolLanes} Lintasan)
          </div>
        </div>
      </footer>

      {/* Global Printable Modal */}
      <PrintModal />
    </div>
  );
};

export default function App() {
  return (
    <SwimDataProvider>
      <MainContent />
    </SwimDataProvider>
  );
}
