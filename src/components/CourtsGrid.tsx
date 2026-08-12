import React, { useState } from 'react';
import { Play, CheckCircle2, RotateCcw, Shuffle, Sparkles, Volume2, Plus, Minus, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Court, Player, SessionSettings } from '../types';

interface CourtsGridProps {
  courts: Court[];
  players: Player[];
  settings: SessionSettings;
  onAssignNext: (courtId: string) => Promise<void>;
  onUpdateScore: (courtId: string, team1Score: number, team2Score: number) => Promise<void>;
  onFinishMatch: (courtId: string) => Promise<void>;
  onResetCourt: (courtId: string, playerIds: string[]) => Promise<void>;
}

export const CourtsGrid: React.FC<CourtsGridProps> = ({
  courts,
  players,
  settings,
  onAssignNext,
  onUpdateScore,
  onFinishMatch,
  onResetCourt
}) => {
  const [loadingCourtId, setLoadingCourtId] = useState<string | null>(null);

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

  const handleFinishClick = async (courtId: string) => {
    // Fire confetti for winners!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setLoadingCourtId(courtId);
    try {
      await onFinishMatch(courtId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourtId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏟️</span>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Active Courts
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {courts.length} Configured
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {courts.map((court) => {
          const isPlaying = court.status === 'playing';
          const team1Players = court.team1.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
          const team2Players = court.team2.map((id) => playerMap.get(id)).filter(Boolean) as Player[];

          const targetScore = settings.targetScore || 11;
          const isMatchPoint = court.team1Score >= targetScore || court.team2Score >= targetScore;

          return (
            <div
              key={court.id}
              className={`rounded-2xl border transition-all shadow-lg overflow-hidden flex flex-col justify-between ${
                isPlaying
                  ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <h3 className="font-bold text-slate-100 text-base">
                    {court.name}
                  </h3>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                    isPlaying
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isPlaying ? 'Match in Progress' : 'Vacant'}
                </span>
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
                        Mode: <span className="capitalize font-semibold text-slate-400">{settings.rotationMode} Rotation</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAssignClick(court.id)}
                      disabled={loadingCourtId === court.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm group"
                      id={`assign-court-${court.id}-btn`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                      <span>Assign Next Court</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Teams Matchup Box */}
                    <div className="grid grid-cols-11 gap-2 items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                      
                      {/* Team 1 */}
                      <div className="col-span-5 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Team 1
                        </span>
                        <div className="space-y-1.5">
                          {team1Players.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2 truncate">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: p.avatarColor || '#10b981' }}
                              >
                                {p.name.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {p.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="col-span-1 text-center font-black text-xs text-slate-500 bg-slate-900 rounded-lg py-1">
                        VS
                      </div>

                      {/* Team 2 */}
                      <div className="col-span-5 space-y-2 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Team 2
                        </span>
                        <div className="space-y-1.5">
                          {team2Players.map((p) => (
                            <div key={p.id} className="flex items-center justify-end space-x-2 truncate">
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {p.name}
                              </span>
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                              >
                                {p.name.charAt(0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Interactive Scoreboard */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      
                      {/* Team 1 Score */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onUpdateScore(court.id, Math.max(0, court.team1Score - 1), court.team2Score)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                          title="Decrease Score"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-3xl font-black text-emerald-400 min-w-[36px] text-center font-mono">
                          {court.team1Score}
                        </span>
                        <button
                          onClick={() => onUpdateScore(court.id, court.team1Score + 1, court.team2Score)}
                          className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-lg transition-colors active:scale-95 shadow"
                          title="Add Point Team 1"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Score
                      </div>

                      {/* Team 2 Score */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onUpdateScore(court.id, court.team1Score, court.team2Score + 1)}
                          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-lg transition-colors active:scale-95 shadow"
                          title="Add Point Team 2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-3xl font-black text-blue-400 min-w-[36px] text-center font-mono">
                          {court.team2Score}
                        </span>
                        <button
                          onClick={() => onUpdateScore(court.id, court.team1Score, Math.max(0, court.team2Score - 1))}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                          title="Decrease Score"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Match Action Button */}
                    <button
                      onClick={() => handleFinishClick(court.id)}
                      disabled={loadingCourtId === court.id}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 ${
                        isMatchPoint
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-bounce'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      id={`finish-court-${court.id}-btn`}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Finish Match & Submit Score</span>
                    </button>

                  </div>
                )}
              </div>

              {/* Card Footer Options for Organizer */}
              {isPlaying && (
                <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Organizer Options:</span>
                  <button
                    onClick={() => onResetCourt(court.id, [...court.team1, ...court.team2])}
                    className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Court</span>
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};
