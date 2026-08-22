import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  RotateCcw,
  Shuffle,
  Sparkles,
  Volume2,
  Plus,
  Minus,
  Trophy,
  Trash2,
  UserCheck,
  Users,
  Shield,
  AlertCircle,
  Zap,
  Swords,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Court, Player, SessionSettings } from "../types";
import { checkMatchWinCondition } from "../lib/pickleballService";

interface CourtsGridProps {
  courts: Court[];
  players: Player[];
  settings: SessionSettings;
  onAssignNext: (courtId: string) => Promise<void>;
  onUpdateScore: (
    courtId: string,
    team1Score: number,
    team2Score: number,
  ) => Promise<void>;
  onFinishMatch: (courtId: string) => Promise<void>;
  onResetCourt: (courtId: string, playerIds: string[]) => Promise<void>;
  onOpenOverrideModal: (court: Court) => void;
  onDeleteCourt?: (courtId: string) => Promise<void>;
  onAddCourt?: () => Promise<void>;
}

export const CourtsGrid: React.FC<CourtsGridProps> = ({
  courts,
  players,
  settings,
  onAssignNext,
  onUpdateScore,
  onFinishMatch,
  onResetCourt,
  onOpenOverrideModal,
  onDeleteCourt,
  onAddCourt,
}) => {
  const [loadingCourtId, setLoadingCourtId] = useState<string | null>(null);
  const [deletingCourtId, setDeletingCourtId] = useState<string | null>(null);
  const [isAddingCourt, setIsAddingCourt] = useState(false);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const handleAssignClick = async (courtId: string) => {
    setLoadingCourtId(courtId);
    try {
      await onAssignNext(courtId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourtId(null);
    }
  };

  const handleFinishClick = async (court: Court) => {
    const targetScore = settings.targetScore || 11;
    const winByTwo = settings.winByTwo !== false; // Default true (11 pts, gap of 2)

    const condition = checkMatchWinCondition(
      court.team1Score,
      court.team2Score,
      targetScore,
      winByTwo,
    );

    const canFinishMatch =
      (court.team1Score >= targetScore || court.team2Score >= targetScore) &&
      Math.abs(court.team1Score - court.team2Score) >= 2;

    if (!condition.isWon) {
      const confirmEarly = window.confirm(
        `⚠️ Standard Pickleball Rule Notice:\n\nA match is won when a team scores at least ${targetScore} points with a 2-point lead (e.g. ${targetScore}-${targetScore - 2} or 12-10).\n\nCurrent score: Team 1 (${court.team1Score}) - Team 2 (${court.team2Score}).\n\nDo you want to submit this score anyway as an early finish?`,
      );
      if (!confirmEarly) return;
    }

    // Fire victory confetti
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });

    setLoadingCourtId(court.id);
    try {
      await onFinishMatch(court.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourtId(null);
    }
  };

  const handleDeleteClick = async (court: Court) => {
    if (!onDeleteCourt) return;
    if (courts.length <= 1) {
      alert("You must have at least one court in the session.");
      return;
    }

    const isPlaying = court.status === "playing";
    const message = isPlaying
      ? `Court "${court.name}" is currently in a match. Deleting this court will cancel the active match and return players to queue. Delete court?`
      : `Are you sure you want to delete ${court.name}?`;

    if (window.confirm(message)) {
      setDeletingCourtId(court.id);
      try {
        await onDeleteCourt(court.id);
      } catch (err) {
        console.error("Failed to delete court:", err);
      } finally {
        setDeletingCourtId(null);
      }
    }
  };

  const handleAddClick = async () => {
    if (!onAddCourt) return;
    setIsAddingCourt(true);
    try {
      await onAddCourt();
    } catch (err) {
      console.error("Failed to add court:", err);
    } finally {
      setIsAddingCourt(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏟️</span>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Active Courts
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {courts.length} Configured
          </span>
          <span className="hidden md:inline-flex text-[11px] font-medium text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Standard 11 Pts • Win by 2
          </span>
        </div>

        {onAddCourt && (
          <button
            onClick={handleAddClick}
            disabled={isAddingCourt}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
            id="add-court-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Court</span>
          </button>
        )}
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {courts.map((court) => {
          const isPlaying = court.status === "playing";
          const team1Players = court.team1
            .map((id) => playerMap.get(id))
            .filter(Boolean) as Player[];
          const team2Players = court.team2
            .map((id) => playerMap.get(id))
            .filter(Boolean) as Player[];

          const targetScore = settings.targetScore || 11;
          const winByTwo = settings.winByTwo !== false;

          const condition = checkMatchWinCondition(
            court.team1Score,
            court.team2Score,
            targetScore,
            winByTwo,
          );

          const canFinishMatch =
            (court.team1Score >= targetScore ||
              court.team2Score >= targetScore) &&
            Math.abs(court.team1Score - court.team2Score) >= 2;

          const isDeleting = deletingCourtId === court.id;

          return (
            <div
              key={court.id}
              className={`rounded-2xl border transition-all shadow-lg overflow-hidden flex flex-col justify-between ${
                isPlaying
                  ? condition.isWon
                    ? "bg-slate-900 border-amber-500/60 shadow-amber-950/30 ring-1 ring-amber-500/30"
                    : "bg-slate-900 border-emerald-500/40 shadow-emerald-950/20"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${isPlaying ? (condition.isWon ? "bg-amber-400 animate-bounce" : "bg-emerald-500 animate-pulse") : "bg-slate-600"}`}
                  />
                  <h3 className="font-bold text-slate-100 text-base">
                    {court.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                      isPlaying
                        ? condition.isWon
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {isPlaying
                      ? condition.isWon
                        ? "Game Won"
                        : "In Progress"
                      : "Vacant"}
                  </span>

                  {/* Override participants button on header */}
                  <button
                    onClick={() => onOpenOverrideModal(court)}
                    className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    title={`Override / Edit Lineup for ${court.name}`}
                    id={`override-court-${court.id}-btn`}
                  >
                    <Users className="w-4 h-4" />
                  </button>

                  {onDeleteCourt && courts.length > 1 && (
                    <button
                      onClick={() => handleDeleteClick(court)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title={`Delete ${court.name}`}
                      id={`delete-court-${court.id}-btn`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-center">
                {!isPlaying ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 text-2xl">
                      🎾
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Court is ready for next match
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mode:{" "}
                        <span className="capitalize font-semibold text-slate-400">
                          {settings.rotationMode} Rotation
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={() => handleAssignClick(court.id)}
                        disabled={loadingCourtId === court.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm group"
                        id={`assign-court-${court.id}-btn`}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                        <span>Auto Assign Queue</span>
                      </button>

                      <button
                        onClick={() => onOpenOverrideModal(court)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-1.5 text-xs"
                        id={`manual-assign-${court.id}-btn`}
                        title="Pick specific players for this court"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Custom Lineup</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Teams Matchup Box */}
                    <div className="grid grid-cols-11 gap-2 items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 relative">
                      {/* Team 1 */}
                      <div className="col-span-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Team 1
                          </span>
                          {condition.winnerTeam === 1 && (
                            <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                              🏆 WINNER
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {team1Players.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">
                              No players set
                            </span>
                          ) : (
                            team1Players.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center space-x-2 truncate"
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: p.avatarColor || "#10b981",
                                  }}
                                >
                                  {p.name.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold text-slate-100 truncate">
                                  {p.name}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="col-span-1 text-center font-black text-xs text-slate-500 bg-slate-900 rounded-lg py-1">
                        VS
                      </div>

                      {/* Team 2 */}
                      <div className="col-span-5 space-y-2 text-right">
                        <div className="flex items-center justify-between">
                          {condition.winnerTeam === 2 ? (
                            <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                              🏆 WINNER
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                            Team 2
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {team2Players.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">
                              No players set
                            </span>
                          ) : (
                            team2Players.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-end space-x-2 truncate"
                              >
                                <span className="text-sm font-semibold text-slate-100 truncate">
                                  {p.name}
                                </span>
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: p.avatarColor || "#3b82f6",
                                  }}
                                >
                                  {p.name.charAt(0)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Match Status Banner */}
                    {condition.isWon ? (
                      <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 text-center flex items-center justify-center space-x-2 animate-pulse">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-200">
                          Game Won by Team {condition.winnerTeam}! (11+ pts &
                          lead of 2+)
                        </span>
                      </div>
                    ) : condition.isDeuce ? (
                      <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2 text-center flex items-center justify-center space-x-1.5">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-xs font-bold text-rose-200">
                          Deuce ({court.team1Score}-{court.team2Score}) •
                          2-Point Lead Required to Win
                        </span>
                      </div>
                    ) : condition.isMatchPoint ? (
                      <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-2 text-center flex items-center justify-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-200">
                          ⚡ Match Point for Team {condition.matchPointTeam}!
                          (11 pts / win by 2)
                        </span>
                      </div>
                    ) : null}

                    {/* Interactive Scoreboard */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      {/* Team 1 Score */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            onUpdateScore(
                              court.id,
                              Math.max(0, court.team1Score - 1),
                              court.team2Score,
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                          title="Decrease Team 1 Score"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-3xl font-black text-emerald-400 min-w-[36px] text-center font-mono">
                          {court.team1Score}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateScore(
                              court.id,
                              court.team1Score + 1,
                              court.team2Score,
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-lg transition-colors active:scale-95 shadow"
                          title="Add Point Team 1"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Target
                        </div>
                        <div className="text-xs font-extrabold text-slate-400 font-mono">
                          {targetScore} PTS (By 2)
                        </div>
                      </div>

                      {/* Team 2 Score */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            onUpdateScore(
                              court.id,
                              court.team1Score,
                              court.team2Score + 1,
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-lg transition-colors active:scale-95 shadow"
                          title="Add Point Team 2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-3xl font-black text-blue-400 min-w-[36px] text-center font-mono">
                          {court.team2Score}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateScore(
                              court.id,
                              court.team1Score,
                              Math.max(0, court.team2Score - 1),
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                          title="Decrease Team 2 Score"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Match Action Button */}
                    <button
                      onClick={() => handleFinishClick(court)}
                      disabled={loadingCourtId === court.id || !canFinishMatch}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 ${
                        condition.isWon
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 animate-bounce"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                      id={`finish-court-${court.id}-btn`}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>
                        {condition.isWon
                          ? "Submit Official Victory"
                          : "Finish Match & Submit Score"}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Options for Organizer */}
              {isPlaying && (
                <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Organizer Options:</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onOpenOverrideModal(court)}
                      className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      title="Override participants on this court"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Override Lineup</span>
                    </button>

                    <span className="text-slate-700">•</span>

                    <button
                      onClick={() =>
                        onResetCourt(court.id, [...court.team1, ...court.team2])
                      }
                      className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
