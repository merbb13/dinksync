import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Plus,
  Lock,
  Unlock,
  Key,
  Grid,
  Users,
  Calendar,
  ChevronRight,
  Zap,
  CheckCircle2,
  HelpCircle,
  X,
} from "lucide-react";
import { Session, SessionSettings } from "../types";

interface WelcomeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (
    title: string,
    courtCount: number,
    settings: Partial<SessionSettings>,
    isPrivate?: boolean,
    passcode?: string,
    rosterType?: "generated" | "empty" | "custom",
    customPlayerNames?: string[],
  ) => Promise<string>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
}) => {
  const [activeMode, setActiveMode] = useState<"create" | "select">("create");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [courtCount, setCourtCount] = useState<number>(3);
  const [gameType, setGameType] = useState<"doubles" | "singles">("doubles");
  const [rotationMode, setRotationMode] = useState<
    "random" | "queue" | "balanced" | "king"
  >("random");
  const [targetScore, setTargetScore] = useState<number>(11);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("1234");

  // Player roster options for new session
  const [rosterType, setRosterType] = useState<
    "generated" | "empty" | "custom"
  >("generated");
  const [customPlayersInput, setCustomPlayersInput] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Private PIN state
  const [unlockTargetSession, setUnlockTargetSession] =
    useState<Session | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);

      const parsedCustomNames = customPlayersInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const newId = await onCreateSession(
        newTitle.trim(),
        courtCount,
        {
          gameType,
          rotationMode,
          targetScore,
          winByTwo: true,
        },
        isPrivate,
        isPrivate ? passcode.trim() || "1234" : "1234",
        rosterType,
        parsedCustomNames,
      );

      // Save unlocked state if private
      if (isPrivate) {
        try {
          const list: string[] = JSON.parse(
            localStorage.getItem("dinksync_unlocked_sessions") || "[]",
          );
          if (!list.includes(newId)) {
            list.push(newId);
            localStorage.setItem(
              "dinksync_unlocked_sessions",
              JSON.stringify(list),
            );
          }
        } catch (e) {
          console.error("Error saving unlocked session", e);
        }
      }

      setIsSubmitting(false);
      onSelectSession(newId);
      onClose();
    } catch (err) {
      console.error("Failed to create session:", err);
      setIsSubmitting(false);
      alert("Failed to create session. Please try again.");
    }
  };

  const handleSelectSessionAttempt = (sess: Session) => {
    const unlockedList: string[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dinksync_unlocked_sessions") || "[]",
        );
      } catch {
        return [];
      }
    })();

    const isUnlocked =
      !sess.isPrivate ||
      sess.id === currentSessionId ||
      unlockedList.includes(sess.id);

    if (isUnlocked) {
      onSelectSession(sess.id);
      onClose();
    } else {
      setUnlockTargetSession(sess);
      setPinInput("");
      setPinError(null);
    }
  };

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTargetSession) return;

    const targetPasscode = unlockTargetSession.passcode || "1234";
    if (pinInput.trim() === targetPasscode) {
      try {
        const list: string[] = JSON.parse(
          localStorage.getItem("dinksync_unlocked_sessions") || "[]",
        );
        if (!list.includes(unlockTargetSession.id)) {
          list.push(unlockTargetSession.id);
          localStorage.setItem(
            "dinksync_unlocked_sessions",
            JSON.stringify(list),
          );
        }
      } catch (e) {
        console.error(e);
      }
      onSelectSession(unlockTargetSession.id);
      setUnlockTargetSession(null);
      onClose();
    } else {
      setPinError("Incorrect PIN or passcode!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Banner Header */}
        <div className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 p-6 sm:p-8 border-b border-slate-800 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Continue to current active court"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-4">
            <Zap className="w-8 h-8 fill-emerald-400/20" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to DinkSync
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mt-2">
            Real-time Pickleball court rotation, player queues, and match
            scoring. To get started, create a new session or join an active one
            below.
          </p>

          {/* Action Chooser Tabs */}
          <div className="flex bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl mt-6 w-full max-w-md">
            <button
              onClick={() => setActiveMode("create")}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                activeMode === "create"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Session</span>
            </button>
            <button
              onClick={() => setActiveMode("select")}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                activeMode === "select"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Join / Select Session ({sessions.length})</span>
            </button>
          </div>
        </div>

        {/* PIN Overlay */}
        {unlockTargetSession && (
          <div className="p-6 bg-slate-950 border-b border-amber-500/30 flex flex-col items-center text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Private Session: {unlockTargetSession.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the session PIN or passcode to view courts and players
              </p>
            </div>

            <form
              onSubmit={handleVerifyPinSubmit}
              className="w-full max-w-xs space-y-3"
            >
              <input
                type="password"
                maxLength={10}
                placeholder="Session PIN"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
              />

              {pinError && (
                <p className="text-xs font-semibold text-rose-400">
                  {pinError}
                </p>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setUnlockTargetSession(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Unlock & Join
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* MODE 1: CREATE NEW SESSION */}
          {activeMode === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>
                    Session Name / Event Title{" "}
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    Each session has isolated players & matches
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friday Evening Open Play, Courts 1-4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-medium transition-all"
                />
              </div>

              {/* Court Count Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex justify-between">
                  <span>Active Courts Count</span>
                  <span className="text-emerald-400 font-extrabold">
                    {courtCount} Courts
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCourtCount(num)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        courtCount === num
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Format & Rotation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Game Format
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="doubles">Doubles (4 Players / Court)</option>
                    <option value="singles">Singles (2 Players / Court)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Rotation Mode
                  </label>
                  <select
                    value={rotationMode}
                    onChange={(e) => setRotationMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="random">Random Pairing</option>
                    <option value="queue">Lowest Games First</option>
                    <option value="balanced">Skill Level Balanced</option>
                    <option value="king">King of the Court</option>
                  </select>
                </div>
              </div>

              {/* Initial Player Roster Option - Explicit requirement: Sessions have different players */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Initial Player Roster Setup</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Choose how initial players are added for this specific
                      session
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setRosterType("custom")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      rosterType === "custom"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span>📝 Custom Names</span>
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Enter your own list of player names
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterType("empty")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      rosterType === "empty"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <span>🚫 Empty Session</span>
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Start with 0 players (add as players arrive)
                    </span>
                  </button>
                </div>

                {rosterType === "custom" && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Comma-separated player names:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mike, Sarah, David, Chris, Jennifer, Tom"
                      value={customPlayersInput}
                      onChange={(e) => setCustomPlayersInput(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Private Session Switch */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl border ${isPrivate ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-slate-700 text-slate-400 border-slate-600"}`}
                    >
                      {isPrivate ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Protect with Access PIN
                      </div>
                      <div className="text-xs text-slate-400">
                        Require password to access court queue
                      </div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {isPrivate && (
                  <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center gap-3 animate-fadeIn">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-amber-300 flex items-center space-x-1">
                        <Key className="w-3.5 h-3.5" />
                        <span>Session Passcode / Access PIN</span>
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Set a PIN for organizers & players
                      </p>
                    </div>
                    <input
                      type="text"
                      required={isPrivate}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. 1234"
                      maxLength={10}
                      className="w-full sm:w-36 bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-center font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <span>Launching Session...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Create & Launch New Session</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: SELECT EXISTING ACTIVE SESSION */}
          {activeMode === "select" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select an active pickleball session to join:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Firebase Sync</span>
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm bg-slate-800/30 border border-slate-800 rounded-2xl">
                  No active sessions found. Create a new session above!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sessions.map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    const dateStr = sess.createdAt
                      ? new Date(sess.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent";

                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSessionAttempt(sess)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isActive
                            ? "bg-emerald-950/30 border-emerald-500/80 shadow-lg"
                            : sess.isPrivate
                              ? "bg-slate-800/60 border-amber-500/30 hover:border-amber-500/70"
                              : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-white text-base sm:text-lg truncate">
                              {sess.title || "DinkSync Open Play"}
                            </h3>
                            {sess.isPrivate && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold tracking-wider flex items-center space-x-1 shrink-0">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>PRIVATE</span>
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold tracking-wider uppercase shrink-0">
                                CURRENT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Grid className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sess.courtCount || 3} Courts</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateStr}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSessionAttempt(sess);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                              isActive
                                ? "bg-emerald-600 text-white"
                                : sess.isPrivate
                                  ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 hover:bg-amber-600/50"
                                  : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                            }`}
                          >
                            <span>
                              {isActive
                                ? "Active Court Board"
                                : sess.isPrivate
                                  ? "Unlock & Join"
                                  : "Join Session"}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Active Session ID:{" "}
            <code className="text-slate-300 font-mono">{currentSessionId}</code>
          </span>
        </div>
      </div>
    </div>
  );
};
