import React, { useEffect, useState } from "react";
import { ensureAuth } from "./lib/firebase";
import {
  initializeSessionIfNeeded,
  subscribeSession,
  subscribePlayers,
  subscribeCourts,
  subscribeMatches,
  subscribeAllSessions,
  createNewSession,
  deleteSession,
  addOrUpdatePlayer,
  setPlayerStatus,
  removePlayer,
  updateSessionSettings,
  updateCourtsConfig,
  deleteCourt,
  addCourt,
  assignNextCourt,
  updateCourtScore,
  finishMatch,
  resetCourt,
  overrideCourtParticipants,
  endSession,
  seedDemoData,
  resetSessionStats,
  DEFAULT_SESSION_ID,
} from "./lib/pickleballService";
import { announceCourtAssignment } from "./lib/announcement";
import { Player, Court, Match, Session, SessionSettings } from "./types";
import { Navbar } from "./components/Navbar";
import { CourtsGrid } from "./components/CourtsGrid";
import { QueueAndPlayers } from "./components/QueueAndPlayers";
import { Leaderboard } from "./components/Leaderboard";
import { SettingsModal } from "./components/SettingsModal";
import { SessionManagerModal } from "./components/SessionManagerModal";
import { MatchHistoryModal } from "./components/MatchHistoryModal";
import { PlayerStatsModal } from "./components/PlayerStatsModal";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { CourtOverrideModal } from "./components/CourtOverrideModal";
import { EndSessionModal } from "./components/EndSessionModal";
import {
  History,
  Volume2,
  Sparkles,
  Trophy,
  Users,
  Layers,
  Share2,
  Lock,
  Flag,
} from "lucide-react";

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    if (sessionFromUrl) return sessionFromUrl;
    return localStorage.getItem("dinksync_session_id") || DEFAULT_SESSION_ID;
  });

  // Welcome / Session Creation Screen State:
  // User requested: "when the app opens, it will ask for a new session"
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    // Open on startup if no explicit deep link parameter exists
    return !sessionFromUrl;
  });

  const [session, setSession] = useState<Session | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  const [courtForOverrideModal, setCourtForOverrideModal] =
    useState<Court | null>(null);
  const [selectedPlayerForStats, setSelectedPlayerForStats] =
    useState<Player | null>(null);

  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);

  // Subscribe to all sessions list
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeAllSessions((sessions) => {
      if (isMounted) setAllSessions(sessions);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Initialize Firebase Auth and Realtime subscriptions for active session
  useEffect(() => {
    let unsubSession: (() => void) | undefined;
    let unsubPlayers: (() => void) | undefined;
    let unsubCourts: (() => void) | undefined;
    let unsubMatches: (() => void) | undefined;
    let isMounted = true;

    async function setup() {
      try {
        await ensureAuth();
        await initializeSessionIfNeeded(currentSessionId);

        if (!isMounted) return;

        localStorage.setItem("dinksync_session_id", currentSessionId);
        const url = new URL(window.location.href);
        if (url.searchParams.get("session") !== currentSessionId) {
          url.searchParams.set("session", currentSessionId);
          window.history.replaceState({}, "", url.toString());
        }

        unsubSession = subscribeSession(currentSessionId, (s) => {
          if (isMounted) setSession(s);
        });
        unsubPlayers = subscribePlayers(currentSessionId, (p) => {
          if (isMounted) setPlayers(p);
        });
        unsubCourts = subscribeCourts(currentSessionId, (c) => {
          if (isMounted) setCourts(c);
        });
        unsubMatches = subscribeMatches(currentSessionId, (m) => {
          if (isMounted) setMatches(m);
        });
      } catch (err) {
        console.error(
          "Initialization error for session:",
          currentSessionId,
          err,
        );
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
  }, [currentSessionId]);

  // Assign Next Court Logic
  const handleAssignNextCourt = async (courtId: string) => {
    const rotationMode = session?.settings?.rotationMode || "random";
    const gameType = session?.settings?.gameType || "doubles";
    const courtObj = courts.find((c) => c.id === courtId);

    const res = await assignNextCourt(
      currentSessionId,
      courtId,
      players,
      rotationMode,
      gameType,
      courtObj?.name,
    );

    if (res.success) {
      setAnnouncementMsg(res.message);
      if (res.assignedNames) {
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
  const handleUpdateScore = async (
    courtId: string,
    team1Score: number,
    team2Score: number,
  ) => {
    const courtObj = courts.find((c) => c.id === courtId);
    await updateCourtScore(
      currentSessionId,
      courtId,
      team1Score,
      team2Score,
      courtObj?.currentMatchId,
    );
  };

  // Finish Match (11 pts, gap of 2)
  const handleFinishMatch = async (courtId: string) => {
    const courtObj = courts.find((c) => c.id === courtId);
    await finishMatch(currentSessionId, courtId, players, courtObj);
  };

  // Reset Court
  const handleResetCourt = async (courtId: string, playerIds: string[]) => {
    await resetCourt(currentSessionId, courtId, playerIds);
  };

  // Court Participant Override
  const handleSaveCourtOverride = async (
    courtId: string,
    team1Ids: string[],
    team2Ids: string[],
  ) => {
    const courtObj = courts.find((c) => c.id === courtId);
    const res = await overrideCourtParticipants(
      currentSessionId,
      courtId,
      team1Ids,
      team2Ids,
      players,
      courtObj,
    );

    if (res.message) {
      setAnnouncementMsg(res.message);
      setTimeout(() => setAnnouncementMsg(null), 7000);
    }
  };

  const handleQuickAddPlayer = async (name: string, skill: string) => {
    const pid = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await addOrUpdatePlayer(currentSessionId, pid, name, skill);
    return pid;
  };

  // End Session Handlers
  const handleConfirmEndSession = async () => {
    await endSession(currentSessionId);
    setAnnouncementMsg(
      `Session "${session?.title || "Open Play"}" has ended and scores are finalized!`,
    );
    setTimeout(() => setAnnouncementMsg(null), 8000);
  };

  const handleEndAndNewSession = () => {
    setIsEndSessionModalOpen(false);
    setIsWelcomeModalOpen(true);
  };

  // Settings & Court Handlers
  const handleUpdateSettings = async (settings: any) => {
    await updateSessionSettings(currentSessionId, settings);
  };

  const handleUpdateCourts = async (courtNames: string[]) => {
    await updateCourtsConfig(currentSessionId, courtNames, players);
  };

  const handleDeleteCourt = async (courtId: string) => {
    await deleteCourt(currentSessionId, courtId, players, courts);
  };

  const handleAddCourt = async () => {
    await addCourt(currentSessionId, courts);
  };

  const handleSeedDemo = async () => {
    await seedDemoData(currentSessionId);
  };

  const handleResetStats = async () => {
    if (
      confirm(
        "Are you sure you want to reset all player stats and match history for this session?",
      )
    ) {
      await resetSessionStats(currentSessionId, players);
    }
  };

  // Multi-session Handlers
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleCreateSession = async (
    title: string,
    courtCount: number,
    settings: Partial<SessionSettings>,
    isPrivate?: boolean,
    passcode?: string,
    rosterType?: "generated" | "empty" | "custom",
    customPlayerNames?: string[],
  ) => {
    return await createNewSession(
      title,
      courtCount,
      settings,
      isPrivate,
      passcode,
      rosterType,
      customPlayerNames,
    );
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setCurrentSessionId(DEFAULT_SESSION_ID);
    }
  };

  const activePlayersCount = players.filter(
    (p) => p.status === "active",
  ).length;
  const activeCourtsCount = courts.filter((c) => c.status === "playing").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        sessionTitle={session?.title || "DinkSync Open Play"}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSessionManager={() => setIsSessionModalOpen(true)}
        onOpenWelcome={() => setIsWelcomeModalOpen(true)}
        onOpenEndSession={() => setIsEndSessionModalOpen(true)}
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
              className="text-emerald-400 hover:text-white font-bold text-xs uppercase px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Bar for Session Overview, End Session & Match History */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shadow-inner">
              🏓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{session?.title || "DinkSync Open Play"}</span>
                  {session?.status === "completed" && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                      Completed
                    </span>
                  )}
                  {session?.isPrivate && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Private</span>
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setIsSessionModalOpen(true)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-0.5 rounded-lg border border-slate-700 transition-colors"
                >
                  Switch Session
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Target:{" "}
                <span className="text-emerald-400 font-bold">
                  {session?.settings?.targetScore || 11} Pts (Win by 2)
                </span>{" "}
                • Rotation:{" "}
                <span className="capitalize text-slate-300 font-semibold">
                  {session?.settings?.rotationMode || "random"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-2">
            {/* End Session Podium Trigger */}
            <button
              onClick={() => setIsEndSessionModalOpen(true)}
              className="flex items-center space-x-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              id="end-session-bar-btn"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>End Session & Awards</span>
            </button>

            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Sessions ({allSessions.length})</span>
            </button>

            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              id="open-history-btn"
            >
              <History className="w-4 h-4 text-blue-400" />
              <span>History ({matches.length})</span>
            </button>
          </div>
        </div>

        {/* Courts Section */}
        <CourtsGrid
          courts={courts}
          players={players}
          settings={
            session?.settings || {
              targetScore: 11,
              winByTwo: true,
              gameType: "doubles",
              rotationMode: "random",
            }
          }
          onAssignNext={handleAssignNextCourt}
          onUpdateScore={handleUpdateScore}
          onFinishMatch={handleFinishMatch}
          onResetCourt={handleResetCourt}
          onOpenOverrideModal={(court) => setCourtForOverrideModal(court)}
          onDeleteCourt={handleDeleteCourt}
          onAddCourt={handleAddCourt}
        />

        {/* Two Column Grid for Queue/Roster and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <QueueAndPlayers
            players={players}
            onAddPlayer={async (name, skillLevel) => {
              const pid = `player_${Date.now()}`;
              await addOrUpdatePlayer(currentSessionId, pid, name, skillLevel);
            }}
            onUpdatePlayerStatus={async (playerId, status) => {
              await setPlayerStatus(currentSessionId, playerId, status);
            }}
            onRemovePlayer={async (playerId) => {
              await removePlayer(currentSessionId, playerId);
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
          <p>🏓 DinkSync Pro • Open Play Rotation & Court Management Engine</p>
          <p className="text-slate-600">
            Standard 11-Point Win-by-2 Scoring • Firebase Live Sync
          </p>
        </div>
      </footer>

      {/* Modals */}
      <WelcomeScreen
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        sessions={allSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
      />

      <SessionManagerModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={allSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
      />

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

      <CourtOverrideModal
        isOpen={courtForOverrideModal !== null}
        onClose={() => setCourtForOverrideModal(null)}
        court={courtForOverrideModal}
        courts={courts}
        players={players}
        settings={
          session?.settings || {
            targetScore: 11,
            winByTwo: true,
            gameType: "doubles",
            rotationMode: "random",
          }
        }
        onSaveOverride={handleSaveCourtOverride}
        onAddQuickPlayer={handleQuickAddPlayer}
      />

      <EndSessionModal
        isOpen={isEndSessionModalOpen}
        onClose={() => setIsEndSessionModalOpen(false)}
        session={session}
        players={players}
        matches={matches}
        onEndAndNewSession={handleEndAndNewSession}
        onConfirmEndSession={handleConfirmEndSession}
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
