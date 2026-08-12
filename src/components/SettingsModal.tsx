import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Trash2, Plus, Sliders, Database, Layers } from 'lucide-react';
import { Session, SessionSettings, Player } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  players: Player[];
  onUpdateSettings: (settings: Partial<SessionSettings>) => Promise<void>;
  onUpdateCourts: (courtNames: string[]) => Promise<void>;
  onSeedDemo: () => Promise<void>;
  onResetStats: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
  onUpdateSettings,
  onUpdateCourts,
  onSeedDemo,
  onResetStats
}) => {
  const [targetScore, setTargetScore] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [gameType, setGameType] = useState<'doubles' | 'singles'>('doubles');
  const [rotationMode, setRotationMode] = useState<'random' | 'balanced' | 'queue' | 'king'>('random');
  const [courtNames, setCourtNames] = useState<string[]>(['Court 1', 'Court 2', 'Court 3']);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (session) {
      setTargetScore(session.settings?.targetScore || 11);
      setWinByTwo(session.settings?.winByTwo ?? true);
      setGameType(session.settings?.gameType || 'doubles');
      setRotationMode(session.settings?.rotationMode || 'random');
      setCourtNames(session.courtNames?.length ? session.courtNames : ['Court 1', 'Court 2', 'Court 3']);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleAddCourt = () => {
    setCourtNames([...courtNames, `Court ${courtNames.length + 1}`]);
  };

  const handleRemoveCourt = (index: number) => {
    if (courtNames.length <= 1) return;
    const newNames = courtNames.filter((_, i) => i !== index);
    setCourtNames(newNames);
  };

  const handleCourtNameChange = (index: number, val: string) => {
    const newNames = [...courtNames];
    newNames[index] = val;
    setCourtNames(newNames);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        targetScore,
        winByTwo,
        gameType,
        rotationMode
      });
      await onUpdateCourts(courtNames);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedClick = async () => {
    setIsSeeding(true);
    try {
      await onSeedDemo();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          id="close-settings-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            ⚙️
          </div>
          <div>
            <h2 className="text-xl font-bold">Session & Court Settings</h2>
            <p className="text-xs text-slate-400">
              Organizer Controls for Open Play Rotation
            </p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Section 1: Court Setup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Courts Setup ({courtNames.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddCourt}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Court</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {courtNames.map((name, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-mono w-6">#{i + 1}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleCourtNameChange(i, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  {courtNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCourt(i)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Rotation & Game Rules */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Match Rules & Pairing Mode
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Rotation Logic</label>
                <select
                  value={rotationMode}
                  onChange={(e) => setRotationMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium"
                >
                  <option value="random">🎲 Pure Random Shuffle</option>
                  <option value="queue">⏳ Queue / Fewest Games Played</option>
                  <option value="balanced">⚖️ Skill Level Balanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Target Score</label>
                <select
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium"
                >
                  <option value={11}>11 Points</option>
                  <option value={15}>15 Points</option>
                  <option value={21}>21 Points</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Format</label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium"
                >
                  <option value="doubles">Doubles (4 Players / Court)</option>
                  <option value="singles">Singles (2 Players / Court)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="winByTwo"
                  checked={winByTwo}
                  onChange={(e) => setWinByTwo(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="winByTwo" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Win By Two
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Demo Data & Reset */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Demo Data & Session Reset</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSeedClick}
                disabled={isSeeding}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Seed Sample Players ({players.length})</span>
              </button>

              <button
                type="button"
                onClick={onResetStats}
                className="flex-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Leaderboard Stats</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-white text-sm flex items-center justify-center space-x-2"
              id="save-settings-btn"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
