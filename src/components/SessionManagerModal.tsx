import React, { useState } from "react";
import {
  X,
  Plus,
  Layers,
  Check,
  Copy,
  Trash2,
  Calendar,
  Grid,
  Radio,
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import { Session, SessionSettings } from "../types";

interface SessionManagerModalProps {
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
  onDeleteSession: (sessionId: string) => Promise<void>;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}) => {
  const [activeTab, setActiveTab] = useState<"switch" | "create">("switch");

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
  const [rosterType, setRosterType] = useState<
    "generated" | "empty" | "custom"
  >("generated");
  const [customPlayersInput, setCustomPlayersInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Private Session PIN Verification State
  const [unlockTargetSession, setUnlockTargetSession] =
    useState<Session | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const parsedCustomNames = customPlayersInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const newId = await onCreateSession(
        newTitle,
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

      // Auto unlock created session
      saveUnlockedSession(newId);

      setIsSubmitting(false);
      setNewTitle("");
      setActiveTab("switch");
      onSelectSession(newId);
      onClose();
    } catch (err) {
      console.error("Failed to create session:", err);
      setIsSubmitting(false);
      alert("Failed to create session. Please try again.");
    }
  };

  const getUnlockedSessions = (): string[] => {
    try {
      const stored = localStorage.getItem("dinksync_unlocked_sessions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveUnlockedSession = (sessionId: string) => {
    try {
      const list = getUnlockedSessions();
      if (!list.includes(sessionId)) {
        list.push(sessionId);
        localStorage.setItem(
          "dinksync_unlocked_sessions",
          JSON.stringify(list),
        );
      }
    } catch (e) {
      console.error("Error saving unlocked session", e);
    }
  };

  const handleAttemptSwitch = (sess: Session) => {
    const isUnlocked =
      !sess.isPrivate ||
      sess.id === currentSessionId ||
      getUnlockedSessions().includes(sess.id);

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
      saveUnlockedSession(unlockTargetSession.id);
      onSelectSession(unlockTargetSession.id);
      setUnlockTargetSession(null);
      onClose();
    } else {
      setPinError("Incorrect PIN or Passcode. Please try again.");
    }
  };

  const copyShareLink = (sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("session", sessionId);
    navigator.clipboard.writeText(url.toString());
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    sessionId: string,
    title: string,
  ) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete session "${title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await onDeleteSession(sessionId);
      } catch (err: any) {
        alert(err.message || "Error deleting session");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Session Manager
              </h2>
              <p className="text-xs text-slate-400">
                Switch between events or create new court rotation sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Verification Popup overlay inside modal */}
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
                Enter the session passcode / PIN to access court assignments
              </p>
            </div>

            <form
              onSubmit={handleVerifyPinSubmit}
              className="w-full max-w-xs space-y-3"
            >
              <input
                type="password"
                maxLength={10}
                placeholder="Enter Session Passcode / PIN"
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
                  Unlock & Switch
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("switch")}
            className={`px-4 py-2.5 rounded-t-lg font-semibold text-xs sm:text-sm flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "switch"
                ? "border-emerald-500 text-emerald-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Sessions ({sessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2.5 rounded-t-lg font-semibold text-xs sm:text-sm flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "create"
                ? "border-emerald-500 text-emerald-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SWITCH SESSION */}
          {activeTab === "switch" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Select a session to load court & player queues:</span>
                <span className="text-emerald-400 font-medium">
                  Real-time synced
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No sessions found. Create a new one!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sessions.map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    const isUnlocked =
                      !sess.isPrivate ||
                      isActive ||
                      getUnlockedSessions().includes(sess.id);

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
                        onClick={() => handleAttemptSwitch(sess)}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isActive
                            ? "bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/20"
                            : sess.isPrivate && !isUnlocked
                              ? "bg-slate-900/60 border-amber-500/30 hover:border-amber-500/60"
                              : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-100 truncate text-base">
                              {sess.title || "DinkSync Open Play"}
                            </h3>
                            {sess.isPrivate && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold tracking-wider flex items-center space-x-1">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>PRIVATE</span>
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                                ACTIVE
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

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                          {/* Share link button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyShareLink(sess.id);
                            }}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border transition-all ${
                              copiedId === sess.id
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                            title="Copy shareable session URL"
                          >
                            {copiedId === sess.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied Link</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Share</span>
                              </>
                            )}
                          </button>

                          {/* Switch Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAttemptSwitch(sess);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                              isActive
                                ? "bg-emerald-600 text-white"
                                : sess.isPrivate && !isUnlocked
                                  ? "bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 border border-amber-500/40"
                                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                            }`}
                          >
                            {sess.isPrivate && !isUnlocked ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-300" />
                                <span>Unlock</span>
                              </>
                            ) : (
                              <>
                                <span>{isActive ? "Current" : "Switch"}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          {/* Delete Session (if not default) */}
                          {sess.id !== "open-play-main" && (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDelete(e, sess.id, sess.title)
                              }
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW SESSION */}
          {activeTab === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Session Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Session Name / Event Title{" "}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wednesday Night Open Play, Court 1-4 Ladder"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>

              {/* Initial Player Roster Setup */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Initial Session Players
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRosterType("generated")}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      rosterType === "generated"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-bold">🎲 Unique Roster</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Fresh 8 player names
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterType("custom")}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      rosterType === "custom"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-bold">📝 Custom Names</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Enter comma list
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterType("empty")}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      rosterType === "empty"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-bold">🚫 Empty Session</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      0 initial players
                    </div>
                  </button>
                </div>

                {rosterType === "custom" && (
                  <div className="pt-1 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="e.g. Mike, Sarah, David, Chris, Jennifer"
                      value={customPlayersInput}
                      onChange={(e) => setCustomPlayersInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Private Session Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-2 rounded-lg border ${isPrivate ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-slate-700 text-slate-400 border-slate-600"}`}
                    >
                      {isPrivate ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">
                        Private Session
                      </div>
                      <div className="text-xs text-slate-400">
                        Require PIN / passcode to view & join courts
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
                        Participants will enter this PIN to access court queues
                      </p>
                    </div>
                    <input
                      type="text"
                      required={isPrivate}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. 1234"
                      maxLength={10}
                      className="w-full sm:w-36 bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-center font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Court Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex justify-between">
                  <span>Number of Active Courts</span>
                  <span className="text-emerald-400 font-bold">
                    {courtCount} Courts
                  </span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCourtCount(num)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
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

              {/* Game Type & Target Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Game Format
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="doubles">Doubles (4 Players / Court)</option>
                    <option value="singles">Singles (2 Players / Court)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Game Score
                  </label>
                  <select
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value={11}>11 Points (Standard)</option>
                    <option value={15}>15 Points</option>
                    <option value={21}>21 Points</option>
                  </select>
                </div>
              </div>

              {/* Rotation Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Court Rotation Algorithm
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      id: "random",
                      label: "Random Shuffle",
                      desc: "Equal chance for active players",
                    },
                    {
                      id: "queue",
                      label: "Lowest Games First",
                      desc: "Prioritizes players with fewest games",
                    },
                    {
                      id: "balanced",
                      label: "Balanced Skill Match",
                      desc: "Groups players by rating",
                    },
                    {
                      id: "king",
                      label: "King of Court",
                      desc: "Winners stay, challengers rotate",
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setRotationMode(mode.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        rotationMode === mode.id
                          ? "bg-emerald-950/30 border-emerald-500/80 text-emerald-300"
                          : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-bold">{mode.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {mode.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Creating Session...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Create & Launch{" "}
                        {isPrivate ? "Private Session" : "Session"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Active Session ID:{" "}
            <code className="text-slate-300">{currentSessionId}</code>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
