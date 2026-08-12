import React, { useState, useEffect } from 'react';
import { X, Check, UserCheck, Shield } from 'lucide-react';
import { Player } from '../types';

interface PlayerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player | null;
  onSavePlayer: (name: string, skillLevel: string) => Promise<void>;
  existingPlayers: Player[];
  onSelectExistingPlayer: (player: Player) => void;
}

const SKILL_LEVELS = [
  { value: '2.5', label: '2.5 - Beginner' },
  { value: '3.0', label: '3.0 - Novice' },
  { value: '3.5', label: '3.5 - Intermediate' },
  { value: '4.0', label: '4.0 - Advanced' },
  { value: '4.5+', label: '4.5+ - Expert' }
];

export const PlayerRegistrationModal: React.FC<PlayerRegistrationModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onSavePlayer,
  existingPlayers,
  onSelectExistingPlayer
}) => {
  const [name, setName] = useState('');
  const [skillLevel, setSkillLevel] = useState('3.5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClaimList, setShowClaimList] = useState(false);

  useEffect(() => {
    if (currentPlayer) {
      setName(currentPlayer.name);
      setSkillLevel(currentPlayer.skillLevel || '3.5');
    }
  }, [currentPlayer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSavePlayer(name.trim(), skillLevel);
      onClose();
    } catch (err) {
      console.error('Error saving player:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          id="close-player-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
            🏓
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {currentPlayer ? 'Edit Player Profile' : 'Join Open Play'}
            </h2>
            <p className="text-xs text-slate-400">
              Set your name to get assigned on courts
            </p>
          </div>
        </div>

        {!showClaimList ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-medium"
                id="player-name-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Skill Level / Rating
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-medium"
                id="player-skill-select"
              >
                {SKILL_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm"
                id="save-player-btn"
              >
                <Check className="w-4 h-4" />
                <span>{currentPlayer ? 'Update Profile' : 'Ready to Play'}</span>
              </button>

              {existingPlayers.length > 0 && !currentPlayer && (
                <button
                  type="button"
                  onClick={() => setShowClaimList(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Select an existing player from list ({existingPlayers.length})</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Your Name
              </span>
              <button
                onClick={() => setShowClaimList(false)}
                className="text-xs text-emerald-400 hover:underline"
              >
                + Create New Instead
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {existingPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectExistingPlayer(p);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase"
                      style={{ backgroundColor: p.avatarColor || '#10b981' }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-200 block">
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        Level {p.skillLevel} • {p.wins} W - {p.losses} L
                      </span>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
