import React, { useEffect, useState } from "react";
import {
  Trophy,
  Award,
  Medal,
  Flame,
  CheckCircle2,
  Sparkles,
  Share2,
  Copy,
  Check,
  RotateCcw,
  X,
  Layers,
  Calendar,
  Zap,
  Activity,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Player, Match, Session } from "../types";

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  players: Player[];
  matches: Match[];
  onEndAndNewSession: () => void;
  onConfirmEndSession: () => Promise<void>;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
  matches,
  onEndAndNewSession,
  onConfirmEndSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Trigger celebratory confetti on open
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  // Rank players by wins, then point diff, then win rate
  const rankedPlayers = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    const rateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
    const rateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
    return rateB - rateA;
  });

  const firstPlace = rankedPlayers[0] || null;
  const secondPlace = rankedPlayers[1] || null;
  const thirdPlace = rankedPlayers[2] || null;

  // Aggregate stats
  const completedMatches = matches.filter((m) => m.status === "completed");
  const totalPointsScored = completedMatches.reduce(
    (acc, m) => acc + (m.team1Score || 0) + (m.team2Score || 0),
    0,
  );

  const handleCopySummary = async () => {
    const title = session.title || "DinkSync Open Play";
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let summary = `🏓 **${title} - Session Results** (${dateStr})\n\n`;
    summary += `🏆 **TOP 3 PODIUM FINISHERS:**\n`;
    if (firstPlace) {
      summary += `🥇 1st Place: ${firstPlace.name} (${firstPlace.wins}W / ${firstPlace.losses}L, +${firstPlace.pointDiff} diff)\n`;
    }
    if (secondPlace) {
      summary += `🥈 2nd Place: ${secondPlace.name} (${secondPlace.wins}W / ${secondPlace.losses}L, ${secondPlace.pointDiff >= 0 ? "+" : ""}${secondPlace.pointDiff} diff)\n`;
    }
    if (thirdPlace) {
      summary += `🥉 3rd Place: ${thirdPlace.name} (${thirdPlace.wins}W / ${thirdPlace.losses}L, ${thirdPlace.pointDiff >= 0 ? "+" : ""}${thirdPlace.pointDiff} diff)\n`;
    }

    summary += `\n📊 **SESSION STATS:**\n`;
    summary += `• Total Matches Completed: ${completedMatches.length}\n`;
    summary += `• Total Points Scored: ${totalPointsScored}\n`;
    summary += `• Active Players: ${players.length}\n`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndSessionClick = async () => {
    try {
      setIsFinishing(true);
      await onConfirmEndSession();
      setIsFinishing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Banner Header with Grand Gradient */}
        <div className="relative bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-900 p-6 sm:p-8 border-b border-slate-800 text-center flex flex-col items-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            id="close-end-session-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/50 mb-3 animate-pulse">
            <Trophy className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
            Session Ceremony & Awards
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {session.title || "DinkSync Open Play"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            Outstanding games! Here are the official top 3 podium champions and
            session stats.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7 flex-1">
          {/* Top 3 Podium Cards */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Top 3 Session Champions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place (Silver) */}
              <div className="order-2 md:order-1 bg-slate-950/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center text-center justify-between relative shadow-lg">
                <div className="absolute -top-3 w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow">
                  2
                </div>
                <div className="pt-3 pb-2 flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md mb-2"
                    style={{
                      backgroundColor: secondPlace?.avatarColor || "#64748b",
                    }}
                  >
                    {secondPlace?.name.charAt(0) || "?"}
                  </div>
                  <h4 className="font-bold text-slate-100 text-base truncate max-w-[180px]">
                    {secondPlace ? secondPlace.name : "No Runner-Up"}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400">
                    🥈 Silver Medalist
                  </span>
                </div>

                {secondPlace && (
                  <div className="w-full pt-3 border-t border-slate-800 grid grid-cols-2 gap-1 text-center text-xs">
                    <div>
                      <span className="text-emerald-400 font-bold font-mono">
                        {secondPlace.wins} W
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Record
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-300 font-bold font-mono">
                        {secondPlace.pointDiff >= 0
                          ? `+${secondPlace.pointDiff}`
                          : secondPlace.pointDiff}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Diff
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 1st Place (Gold - Elevated) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-3xl p-5 flex flex-col items-center text-center justify-between relative shadow-2xl shadow-amber-950/40 md:-translate-y-2">
                <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center border-2 border-slate-900 shadow-lg">
                  🥇
                </div>
                <div className="pt-3 pb-3 flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-xl mb-2 ring-4 ring-amber-500/30"
                    style={{
                      backgroundColor: firstPlace?.avatarColor || "#f59e0b",
                    }}
                  >
                    {firstPlace?.name.charAt(0) || "👑"}
                  </div>
                  <h4 className="font-extrabold text-white text-lg truncate max-w-[200px]">
                    {firstPlace ? firstPlace.name : "No Champion"}
                  </h4>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Session Champion</span>
                  </span>
                </div>

                {firstPlace && (
                  <div className="w-full pt-3 border-t border-amber-500/30 grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <span className="text-emerald-400 font-bold font-mono text-sm">
                        {firstPlace.wins} W
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Wins
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold font-mono text-sm">
                        {firstPlace.gamesPlayed > 0
                          ? Math.round(
                              (firstPlace.wins / firstPlace.gamesPlayed) * 100,
                            )
                          : 0}
                        %
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Win Rate
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-200 font-bold font-mono text-sm">
                        +{firstPlace.pointDiff}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Point Diff
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="order-3 bg-slate-950/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center text-center justify-between relative shadow-lg">
                <div className="absolute -top-3 w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow">
                  3
                </div>
                <div className="pt-3 pb-2 flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md mb-2"
                    style={{
                      backgroundColor: thirdPlace?.avatarColor || "#b45309",
                    }}
                  >
                    {thirdPlace?.name.charAt(0) || "?"}
                  </div>
                  <h4 className="font-bold text-slate-100 text-base truncate max-w-[180px]">
                    {thirdPlace ? thirdPlace.name : "No 3rd Place"}
                  </h4>
                  <span className="text-xs font-semibold text-amber-500">
                    🥉 Bronze Medalist
                  </span>
                </div>

                {thirdPlace && (
                  <div className="w-full pt-3 border-t border-slate-800 grid grid-cols-2 gap-1 text-center text-xs">
                    <div>
                      <span className="text-emerald-400 font-bold font-mono">
                        {thirdPlace.wins} W
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Record
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-300 font-bold font-mono">
                        {thirdPlace.pointDiff >= 0
                          ? `+${thirdPlace.pointDiff}`
                          : thirdPlace.pointDiff}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Diff
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Highlights Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-center p-2">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Matches</span>
              </span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {completedMatches.length}
              </span>
            </div>

            <div className="text-center p-2">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Points Scored</span>
              </span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {totalPointsScored}
              </span>
            </div>

            <div className="text-center p-2">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Total Players</span>
              </span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {players.length}
              </span>
            </div>

            <div className="text-center p-2">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Top Streak</span>
              </span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {Math.max(0, ...players.map((p) => p.streak || 0))} W
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
            id="copy-session-recap-btn"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">
                  Copied to Clipboard!
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Session Recap</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Keep Playing
            </button>

            <button
              type="button"
              onClick={onEndAndNewSession}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center space-x-1.5"
              id="start-new-session-from-end-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start New Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
