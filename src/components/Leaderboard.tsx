import React, { useState } from 'react';
import { Trophy, Award, Flame, TrendingUp, ChevronRight } from 'lucide-react';
import { Player } from '../types';

interface LeaderboardProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

type SortOption = 'wins' | 'winRate' | 'diff' | 'games';

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, onSelectPlayer }) => {
  const [sortBy, setSortBy] = useState<SortOption>('wins');

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'wins') {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointDiff - a.pointDiff;
    }
    if (sortBy === 'winRate') {
      const rateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
      const rateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
      if (rateB !== rateA) return rateB - rateA;
      return b.wins - a.wins;
    }
    if (sortBy === 'diff') {
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.wins - a.wins;
    }
    if (sortBy === 'games') {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return 0;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏆</span>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Session Leaderboard
            </h2>
            <p className="text-xs text-slate-400">
              Rankings updated live after every finished game
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSortBy('wins')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sortBy === 'wins'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Most Wins
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sortBy === 'winRate'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Win %
          </button>
          <button
            onClick={() => setSortBy('diff')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sortBy === 'diff'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            +/- Diff
          </button>
        </div>
      </div>

      {/* Leaderboard Table / List */}
      {sortedPlayers.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          No player statistics available yet. Start playing games to build the leaderboard!
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const winRate =
              player.gamesPlayed > 0
                ? Math.round((player.wins / player.gamesPlayed) * 100)
                : 0;

            let rankBadge = (
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                #{rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-xs flex items-center justify-center shadow">
                  🥇
                </span>
              );
            } else if (rank === 2) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-400/40 font-black text-xs flex items-center justify-center shadow">
                  🥈
                </span>
              );
            } else if (rank === 3) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 font-black text-xs flex items-center justify-center shadow">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  rank === 1
                    ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {rankBadge}

                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md"
                    style={{ backgroundColor: player.avatarColor || '#10b981' }}
                  >
                    {player.name.charAt(0)}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm truncate">
                        {player.name}
                      </span>
                      {player.streak > 1 && (
                        <span className="inline-flex items-center space-x-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{player.streak}W</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      Level {player.skillLevel || '3.5'} • {player.gamesPlayed} Games Played
                    </div>
                  </div>
                </div>

                {/* Metrics Side */}
                <div className="flex items-center space-x-4 sm:space-x-6 text-right shrink-0">
                  <div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {player.wins} W
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {player.losses} L
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <div className="text-sm font-bold text-slate-200 font-mono">
                      {winRate}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Win Rate
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className={`text-sm font-bold font-mono ${player.pointDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {player.pointDiff >= 0 ? `+${player.pointDiff}` : player.pointDiff}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Point Diff
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
