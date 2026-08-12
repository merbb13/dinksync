import React, { useEffect, useState } from 'react';
import {
  ensureAuth
} from './lib/firebase';
import {
  initializeSessionIfNeeded,
  subscribeSession,
  subscribePlayers,
  subscribeCourts,
  subscribeMatches,
  addOrUpdatePlayer,
  setPlayerStatus,
  removePlayer,
  updateSessionSettings,
  updateCourtsConfig,
  assignNextCourt,
  updateCourtScore,
  finishMatch,
  resetCourt,
  seedDemoData,
  resetSessionStats,
  DEFAULT_SESSION_ID
} from './lib/pickleballService';
import { announceCourtAssignment } from './lib/announcement';
import { Player, Court, Match, Session } from './types';
import { Navbar } from './components/Navbar';
import { CourtsGrid } from './components/CourtsGrid';
import { QueueAndPlayers } from './components/QueueAndPlayers';
import { Leaderboard } from './components/Leaderboard';
import { SettingsModal } from './components/SettingsModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { PlayerStatsModal } from './components/PlayerStatsModal';
import { History, Volume2, Sparkles, Trophy, Users } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<Player | null>(null);

  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);

  // Initialize Firebase Auth and Realtime subscriptions
  useEffect(() => {
    let unsubSession: (() => void) | undefined;
    let unsubPlayers: (() => void) | undefined;
    let unsubCourts: (() => void) | undefined;
    let unsubMatches: (() => void) | undefined;
    let isMounted = true;

    async function setup() {
      try {
        await ensureAuth();
        await initializeSessionIfNeeded(DEFAULT_SESSION_ID);

        if (!isMounted) return;

        unsubSession = subscribeSession(DEFAULT_SESSION_ID, (s) => {
          if (isMounted) setSession(s);
        });
        unsubPlayers = subscribePlayers(DEFAULT_SESSION_ID, (p) => {
          if (isMounted) setPlayers(p);
        });
        unsubCourts = subscribeCourts(DEFAULT_SESSION_ID, (c) => {
          if (isMounted) setCourts(c);
        });
        unsubMatches = subscribeMatches(DEFAULT_SESSION_ID, (m) => {
          if (isMounted) setMatches(m);
        });
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    setup();

    return () => {
      isMounted = false;
      if (unsubSession) unsubSession();
      if (unsubPlayers) unsubPlayers();
      if (unsubCourts) unsubCourts();
      if (unsubMatches) unsubMatches();
    };
  }, []);

  // Assign Next Court Logic
  const handleAssignNextCourt = async (courtId: string) => {
    const rotationMode = session?.settings?.rotationMode || 'random';
    const gameType = session?.settings?.gameType || 'doubles';

    const res = await assignNextCourt(
      DEFAULT_SESSION_ID,
      courtId,
      players,
      rotationMode,
      gameType
    );

    if (res.success) {
      setAnnouncementMsg(res.message);
      if (res.assignedNames) {
        const courtObj = courts.find((c) => c.id === courtId);
        const cName = courtObj?.name || courtId;
        const half = Math.ceil(res.assignedNames.length / 2);
        const t1 = res.assignedNames.slice(0, half);
        const t2 = res.assignedNames.slice(half);
        announceCourtAssignment(cName, t1, t2);
      }
      setTimeout(() => setAnnouncementMsg(null), 8000);
    } else {
      alert(res.message);
    }
  };

  // Update Score
  const handleUpdateScore = async (courtId: string, team1Score: number, team2Score: number) => {
    await updateCourtScore(DEFAULT_SESSION_ID, courtId, team1Score, team2Score);
  };

  // Finish Match
  const handleFinishMatch = async (courtId: string) => {
    await finishMatch(DEFAULT_SESSION_ID, courtId, players);
  };

  // Reset Court
  const handleResetCourt = async (courtId: string, playerIds: string[]) => {
    await resetCourt(DEFAULT_SESSION_ID, courtId, playerIds);
  };

  // Settings Handlers
  const handleUpdateSettings = async (settings: any) => {
    await updateSessionSettings(DEFAULT_SESSION_ID, settings);
  };

  const handleUpdateCourts = async (courtNames: string[]) => {
    await updateCourtsConfig(DEFAULT_SESSION_ID, courtNames);
  };

  const handleSeedDemo = async () => {
    await seedDemoData(DEFAULT_SESSION_ID);
  };

  const handleResetStats = async () => {
    if (confirm('Are you sure you want to reset all player stats and match history?')) {
      await resetSessionStats(DEFAULT_SESSION_ID, players);
    }
  };

  const activePlayersCount = players.filter((p) => p.status === 'active').length;
  const activeCourtsCount = courts.filter((c) => c.status === 'playing').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        sessionTitle={session?.title || 'DinkSync Open Play'}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activePlayersCount={activePlayersCount}
        activeCourtsCount={activeCourtsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Announcement if assigned */}
        {announcementMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 shadow-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <p className="font-semibold text-sm sm:text-base">
                {announcementMsg}
              </p>
            </div>
            <button
              onClick={() => setAnnouncementMsg(null)}
              className="text-emerald-400 hover:text-white font-bold text-xs uppercase px-2 py-1 rounded bg-emerald-950"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Bar for Match History */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Live Session Overview
              </h2>
              <p className="text-xs text-slate-400">
                Rotation mode: <span className="capitalize text-emerald-400 font-semibold">{session?.settings?.rotationMode || 'random'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            id="open-history-btn"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Match History ({matches.length})</span>
          </button>
        </div>

        {/* Courts Section */}
        <CourtsGrid
          courts={courts}
          players={players}
          settings={session?.settings || { targetScore: 11, winByTwo: true, gameType: 'doubles', rotationMode: 'random' }}
          onAssignNext={handleAssignNextCourt}
          onUpdateScore={handleUpdateScore}
          onFinishMatch={handleFinishMatch}
          onResetCourt={handleResetCourt}
        />

        {/* Two Column Grid for Queue/Roster and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          <QueueAndPlayers
            players={players}
            onAddPlayer={async (name, skillLevel) => {
              const pid = `player_${Date.now()}`;
              await addOrUpdatePlayer(DEFAULT_SESSION_ID, pid, name, skillLevel);
            }}
            onUpdatePlayerStatus={async (playerId, status) => {
              await setPlayerStatus(DEFAULT_SESSION_ID, playerId, status);
            }}
            onRemovePlayer={async (playerId) => {
              await removePlayer(DEFAULT_SESSION_ID, playerId);
            }}
            onSelectPlayerDetail={(p) => setSelectedPlayerForStats(p)}
          />

          <Leaderboard
            players={players}
            onSelectPlayer={(p) => setSelectedPlayerForStats(p)}
          />

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>🏓 DinkSync Open Play Manager • Real-time Firebase Sync</p>
          <p className="text-slate-600">Built with React & Tailwind CSS</p>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        session={session}
        players={players}
        onUpdateSettings={handleUpdateSettings}
        onUpdateCourts={handleUpdateCourts}
        onSeedDemo={handleSeedDemo}
        onResetStats={handleResetStats}
      />

      <MatchHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        matches={matches}
      />

      <PlayerStatsModal
        isOpen={selectedPlayerForStats !== null}
        onClose={() => setSelectedPlayerForStats(null)}
        player={selectedPlayerForStats}
      />

    </div>
  );
}
