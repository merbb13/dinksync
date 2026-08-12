import React from 'react';
import { X, Trophy, Flame, Target, Award, PlayCircle } from 'lucide-react';
import { Player } from '../types';

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  isOpen,
  onClose,
  player
}) => {
  if (!isOpen || !player) return null;

  const winRate =
    player.gamesPlayed > 0
      ? Math.round((player.wins / player.gamesPlayed) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          id="close-player-stats-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-xl"
            style={{ backgroundColor: player.avatarColor || '#10b981' }}
          >
            {player.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{player.name}</h2>
            <p className="text-xs text-slate-400">
              Skill Level: <strong className="text-emerald-400">{player.skillLevel || '3.5'}</strong> • Status: <span className="capitalize text-slate-300">{player.status}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record (W - L)</span>
            </div>
            <div className="text-2xl font-black text-slate-100 font-mono">
              {player.wins} <span className="text-slate-500 font-normal text-sm">-</span> {player.losses}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Win Rate</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {winRate}%
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Point Diff (+/-)</span>
            </div>
            <div className={`text-2xl font-black font-mono ${player.pointDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {player.pointDiff >= 0 ? `+${player.pointDiff}` : player.pointDiff}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Current Streak</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {player.streak > 0 ? `${player.streak} Win` : `${Math.abs(player.streak)} Loss`}
            </div>
          </div>

        </div>

        <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span>Points Scored: <strong className="text-slate-200">{player.pointsFor}</strong></span>
          <span>Points Against: <strong className="text-slate-200">{player.pointsAgainst}</strong></span>
        </div>

      </div>
    </div>
  );
};
