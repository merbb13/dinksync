import React, { useState, useRef } from 'react';
import { UserPlus, UserCheck, Coffee, PlayCircle, Trash2, CheckCircle, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Player, PlayerStatus } from '../types';

interface QueueAndPlayersProps {
  players: Player[];
  onAddPlayer: (name: string, skillLevel: string) => Promise<void>;
  onUpdatePlayerStatus: (playerId: string, status: PlayerStatus) => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
  onSelectPlayerDetail: (player: Player) => void;
}

export const QueueAndPlayers: React.FC<QueueAndPlayersProps> = ({
  players,
  onAddPlayer,
  onUpdatePlayerStatus,
  onRemovePlayer,
  onSelectPlayerDetail
}) => {
  const [newName, setNewName] = useState('');
  const [newSkill, setNewSkill] = useState('3.5');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeQueue = players.filter((p) => p.status === 'active');
  const playingList = players.filter((p) => p.status === 'playing');
  const sittingOutList = players.filter((p) => p.status === 'sitting_out');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a player name first!');
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    setIsAdding(true);
    try {
      await onAddPlayer(trimmed, newSkill);
      setNewName('');
      setSuccessMsg(`Added "${trimmed}" to queue!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to add player:', err);
      setErrorMsg(err?.message || 'Failed to add player. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📋</span>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Queue & Player Roster
            </h2>
            <p className="text-xs text-slate-400">
              {players.length} Total Players Joined
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {activeQueue.length} Ready in Queue
        </span>
      </div>

      {/* Quick Add Player Form */}
      <div className="space-y-2">
        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add player name..."
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            className={`flex-1 bg-slate-800 border rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
              errorMsg ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-emerald-500'
            }`}
            id="add-player-name-input"
          />
          <select
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            id="add-player-skill-select"
          >
            <option value="2.5">2.5 Beg</option>
            <option value="3.0">3.0 Nov</option>
            <option value="3.5">3.5 Int</option>
            <option value="4.0">4.0 Adv</option>
            <option value="4.5+">4.5+ Exp</option>
          </select>
          <button
            type="submit"
            disabled={isAdding}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-md cursor-pointer"
            id="add-player-submit-btn"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{isAdding ? 'Adding...' : 'Add Player'}</span>
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-rose-400 flex items-center space-x-1 px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}

        {successMsg && (
          <p className="text-xs text-emerald-400 flex items-center space-x-1 px-1">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </p>
        )}
      </div>

      {/* Section 1: Ready in Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Up Next / Active Queue ({activeQueue.length})</span>
          <span>Status</span>
        </div>

        {activeQueue.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No active players in queue. Add players or set status to active!
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {activeQueue.map((p, index) => {
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 transition-all"
                >
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => onSelectPlayerDetail(p)}
                  >
                    <span className="text-xs font-bold text-slate-500 w-4 text-center">
                      #{index + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
                      style={{ backgroundColor: p.avatarColor || '#10b981' }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2">
                        <span>Level {p.skillLevel || '3.5'}</span>
                        <span>•</span>
                        <span>{p.wins}W - {p.losses}L</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Organizer */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdatePlayerStatus(p.id, 'sitting_out')}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-600 hover:border-amber-500/40 text-xs font-medium transition-colors flex items-center space-x-1"
                      title="Sit Out / Rest"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rest</span>
                    </button>

                    <button
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: On Court Now */}
      {playingList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
            <PlayCircle className="w-4 h-4" />
            <span>Currently On Court ({playingList.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {playingList.map((p) => (
              <span
                key={p.id}
                onClick={() => onSelectPlayerDetail(p)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: p.avatarColor || '#10b981' }}
                >
                  {p.name.charAt(0)}
                </div>
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Resting / Sitting Out */}
      {sittingOutList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Coffee className="w-4 h-4" />
            <span>Resting / Sitting Out ({sittingOutList.length})</span>
          </div>
          <div className="space-y-1.5">
            {sittingOutList.map((p) => {
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 font-medium">{p.name}</span>
                  <button
                    onClick={() => onUpdatePlayerStatus(p.id, 'active')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors flex items-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Back to Queue</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
